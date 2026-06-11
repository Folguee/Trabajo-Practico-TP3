import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Download, Calendar } from 'lucide-react-native';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function Exportar() {
  const [startDate, setStartDate] = useState('01/01/2024'); // mocked for now
  const [endDate, setEndDate] = useState('31/12/2024');     // mocked for now
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // CSV mock data (in a real app, you fetch this from Firebase store based on dates)
      const csvData = [
        ['Fecha', 'Tipo', 'Categoría', 'Título', 'Monto', 'Nota'],
        ['28/05/2024', 'Gasto', 'Alimentación', 'Supermercado', '15.50', 'Compra semanal'],
        ['29/05/2024', 'Ingreso', 'Transporte', 'Taxi al centro', '100.00', 'Viaje cliente'],
      ];

      const csvString = csvData.map(row => row.join(',')).join('\n');
      
      const fileName = `exportacion_gastos_${new Date().getTime()}.csv`;
      const fileUri = `${documentDirectory}${fileName}`;

      await writeAsStringAsync(fileUri, csvString, {
        encoding: EncodingType.UTF8,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar movimientos',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un error al generar el archivo');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Background */}
      <View className="bg-[#0f172a] pt-14 pb-8 px-6 rounded-b-3xl">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Exportar Datos</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <Text className="text-slate-800 text-lg font-bold mb-4">Selecciona el rango</Text>

        <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="bg-slate-100 p-3 rounded-full">
              <Calendar size={20} color="#0f172a" />
            </View>
            <View>
              <Text className="text-slate-400 text-xs">Desde</Text>
              <Text className="text-slate-800 font-semibold">{startDate}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Text className="text-indigo-600 font-medium">Cambiar</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-4 shadow-sm shadow-slate-200 mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="bg-slate-100 p-3 rounded-full">
              <Calendar size={20} color="#0f172a" />
            </View>
            <View>
              <Text className="text-slate-400 text-xs">Hasta</Text>
              <Text className="text-slate-800 font-semibold">{endDate}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Text className="text-indigo-600 font-medium">Cambiar</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-500 text-center mb-8 px-4 leading-relaxed">
          Se generará un archivo CSV con tus movimientos que podrás compartir por email o guardar en tu dispositivo.
        </Text>

        <TouchableOpacity 
          className={`bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2 ${isExporting ? 'opacity-70' : 'opacity-100'}`}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Download size={20} color="white" />
          <Text className="text-white font-bold text-lg">{isExporting ? 'Generando...' : 'Generar CSV'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}