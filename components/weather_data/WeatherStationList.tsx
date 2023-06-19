import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ActionList} from 'components/content/ActionList';
import {Card} from 'components/content/Card';
import {incompleteQueryState, QueryState} from 'components/content/QueryState';
import {HStack, View, VStack} from 'components/core';
import {Title1Black, Title3Black} from 'components/text';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {useMapLayer} from 'hooks/useMapLayer';
import {useWeatherStations, ZoneResult} from 'hooks/useWeatherStations';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WeatherStackNavigationProps} from 'routes';
import {StationMetadata} from 'types/generated/snowbound';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

interface Props {
  center_id: AvalancheCenterID;
  requestedTime: string;
}

const StationList = (navigation: WeatherStackNavigationProps, center_id: AvalancheCenterID, requestedTime: string, zones: ZoneResult[]) => {
  const data = zones
    .map(zone => ({
      zoneName: zone.name,
      actions: Object.entries(zone.stationGroups)
        .map(([k, v]) => ({
          label: k,
          data: v,
          action: (name: string, data: StationMetadata[]) => {
            navigation.navigate('stationDetail', {center_id, station_stids: data.map(s => s.stid), name, requestedTime, zoneName: zone.name});
          },
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter(d => d.actions.length > 0);
  return (
    <ScrollView style={{width: '100%', height: '100%'}}>
      <VStack space={8}>
        {data.map((d, i) => (
          <Card borderRadius={0} borderColor="white" header={<Title3Black>{d.zoneName}</Title3Black>} key={i}>
            <ActionList actions={d.actions} />
          </Card>
        ))}
      </VStack>
    </ScrollView>
  );
};

export const WeatherStationList: React.FC<Props> = ({center_id, requestedTime}) => {
  const navigation = useNavigation<WeatherStackNavigationProps>();
  const avalancheCenterMetadataResult = useAvalancheCenterMetadata(center_id);
  const metadata = avalancheCenterMetadataResult.data;
  const mapLayerResult = useMapLayer(center_id);
  const mapLayer = mapLayerResult.data;
  const stationsResult = useWeatherStations({
    token: metadata?.widget_config.stations?.token,
    mapLayer: mapLayer,
    sources: center_id === 'NWAC' ? ['nwac'] : ['mesowest', 'snotel'],
  });
  const zones = stationsResult.data;

  return (
    <View style={{...StyleSheet.absoluteFillObject}} bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <VStack width="100%" height="100%" justifyContent="space-between" alignItems="stretch" bg="background.base">
          <HStack width="100%" py={8} px={16} bg="white">
            <Title1Black>Weather Stations</Title1Black>
          </HStack>
          {incompleteQueryState(avalancheCenterMetadataResult, mapLayerResult, stationsResult) || !metadata || !mapLayer || !zones ? (
            <QueryState results={[avalancheCenterMetadataResult, mapLayerResult, stationsResult]} />
          ) : (
            StationList(navigation, center_id, requestedTime, zones)
          )}
        </VStack>
      </SafeAreaView>
    </View>
  );
};
