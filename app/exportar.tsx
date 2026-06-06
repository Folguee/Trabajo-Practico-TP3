import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Download, Calendar } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { getTransactions } from '../services/transaction.service';
import { useLocalSearchParams } from "expo-router";
import { generateAndDownloadCSV } from '../services/export.service'; // ← Importante

export default function Exportar() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // últimos 90 días
  const [endDate, setEndDate] = useState(new Date());

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { transactionId } = useLocalSearchParams();

  // Cargar transacciones al entrar a la pantalla
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const allTx = await getTransactions();
        setTransactions(allTx || []);
      } catch (error) {
        console.error("Error cargando transacciones:", error);
        Alert.alert("Error", "No se pudieron cargar los movimientos");
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, []);

      const handleExport = async () => {
    console.log("Botón presionado - handleExport iniciado");
    setIsExporting(true);

    try {
      console.log("Transacciones cargadas:", transactions.length);

      if (transactions.length === 0) {
        Alert.alert("Error", "No hay transacciones cargadas");
        return;
      }

            // === FILTRO MEJORADO PARA TUS FECHAS MAL FORMADAS ===
      const filtered = transactions.filter(t => {
        if (!t.date) {
          console.log(`❌ Sin fecha: ${t.title}`);
          return false;
        }

        let txDate: Date | null = null;

        try {
          let dateStr = String(t.date).trim();

          // Caso especial: "SUBE 15/11/2004" o "Trabajo 15/11/2004"
          if (dateStr.includes('/')) {
            const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (match) {
              const [, day, month, year] = match;
              dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }

          txDate = new Date(dateStr);

          if (isNaN(txDate.getTime())) {
            console.log(`❌ Fecha inválida: ${t.title} → ${t.date}`);
            return false;
          }

        } catch (dateError) {
          console.log(`❌ Error parseando fecha en: ${t.title}`, t.date);
          return false;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const isInRange = txDate >= start && txDate <= end;
        console.log(`${t.title} → ${txDate.toISOString().split('T')[0]} ${isInRange ? '✅' : '❌'}`);

        return isInRange;
      });

      console.log("Filtradas por fecha:", filtered.length);

      const finalTransactions = transactionId 
        ? filtered.filter(t => String(t.id || t.transactionId) === String(transactionId))
        : filtered;

      console.log("Transacciones finales:", finalTransactions.length);

      if (finalTransactions.length === 0) {
        Alert.alert("Sin resultados", "No hay movimientos en el rango de fechas seleccionado");
        return;
      }

      const fileName = `reporte_gastos_${new Date().toISOString().split('T')[0]}.csv`;
      console.log("📁 Generando archivo:", fileName);

      await generateAndDownloadCSV(finalTransactions, fileName);
      
      console.log("✅ CSV generado exitosamente");
      Alert.alert("Éxito", `Reporte generado correctamente\n${finalTransactions.length} movimientos exportados`);

    } catch (error: any) {
      console.error("❌ Error en handleExport:", error);
      Alert.alert('Error', error.message || 'Error desconocido al generar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
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
        <Text className="text-slate-800 dark:text-gray-100 text-lg font-bold mb-4">Selecciona el rango</Text>

        {/* Fecha Desde */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-slate-100 dark:bg-gray-700 p-3 rounded-full">
              <Calendar size={20} color="#0f172a" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 dark:text-gray-500 text-xs">Desde</Text>
              <input
                type="date"
                value={startDate.toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginTop: 8,
                  width: "100%",
                }}
              />
            </View>
          </View>
        </View>

        {/* Fecha Hasta */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm shadow-slate-200 dark:shadow-none dark:border dark:border-gray-700 mb-8">
          <View className="flex-row items-center gap-3">
            <View className="bg-slate-100 dark:bg-gray-700 p-3 rounded-full">
              <Calendar size={20} color="#0f172a" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 dark:text-gray-500 text-xs">Hasta</Text>
              <input
                type="date"
                value={endDate.toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginTop: 8,
                  width: "100%",
                }}
              />
            </View>
          </View>
        </View>

        <Text className="text-slate-500 dark:text-gray-400 text-center mb-8 px-4 leading-relaxed">
          Se generará un archivo CSV con tus movimientos que podrás compartir por email o guardar en tu dispositivo.
        </Text>

        <TouchableOpacity
          className={`bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2 ${isExporting ? 'opacity-70' : 'opacity-100'}`}
          onPress={handleExport}
          disabled={isExporting || loading}
        >
          {isExporting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Download size={20} color="white" />
          )}
          <Text className="text-white font-bold text-lg">
            {isExporting ? 'Generando...' : 'Generar CSV'}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-slate-500 dark:text-gray-400 mt-6 text-sm">
          {transactions.length} movimientos cargados
        </Text>
      </ScrollView>
    </View>
  );
}