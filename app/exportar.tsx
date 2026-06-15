import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, Calendar, Filter, FileText, ChevronRight, Sparkles, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { getTransactions } from '../services/transaction.service';
import { getCategoryConfig, parseTransactionDate } from '../constants/transactions';
import { generateAndDownloadCSV } from '../services/export.service';
import SidebarLayout from '../components/SidebarLayout';

export default function Exportar() {
  const { transactionId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // Últimos 90 días
  const [endDate, setEndDate] = useState(new Date());
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSingleMode, setIsSingleMode] = useState(!!transactionId);

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

  // Encontrar la transacción seleccionada (si aplica)
  const selectedTxObj = useMemo(() => {
    if (!transactionId) return null;
    return transactions.find(t => String(t.id || t.transactionId) === String(transactionId));
  }, [transactionId, transactions]);

  // Filtrar transacciones por fecha
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      
      let txDate = parseTransactionDate(t.date);
      if (!txDate) {
        try {
          txDate = new Date(t.date);
        } catch {
          txDate = null;
        }
      }

      if (!txDate || isNaN(txDate.getTime())) return false;

      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return txDate >= start && txDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Estadísticas rápidas del rango seleccionado
  const rangeStats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income');
    const expense = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'shared');
    const totalIncomeVal = income.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpenseVal = expense.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      totalCount: filteredTransactions.length,
      incomeCount: income.length,
      expenseCount: expense.length,
      incomeTotal: totalIncomeVal,
      expenseTotal: totalExpenseVal,
    };
  }, [filteredTransactions]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (transactions.length === 0) {
        Alert.alert("Error", "No hay transacciones cargadas");
        return;
      }

      // Decidir transacciones finales
      const finalTransactions = isSingleMode && selectedTxObj
        ? [selectedTxObj]
        : filteredTransactions;

      if (finalTransactions.length === 0) {
        Alert.alert("Sin resultados", "No hay movimientos en el rango de fechas seleccionado");
        return;
      }

      const filePrefix = isSingleMode ? 'movimiento' : 'reporte_gastos';
      const fileName = `${filePrefix}_${new Date().toISOString().split('T')[0]}.csv`;

      await generateAndDownloadCSV(finalTransactions, fileName);
      Alert.alert("Éxito", `Reporte generado correctamente\n${finalTransactions.length} movimientos exportados`);
    } catch (error: any) {
      console.error("Error en handleExport:", error);
      Alert.alert('Error', error.message || 'Error desconocido al generar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const applyPreset = (days: number | 'month') => {
    const end = new Date();
    let start = new Date();
    if (days === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else {
      start.setDate(end.getDate() - days);
    }
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <SidebarLayout active="dashboard">
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cabecera / Banner superior (Navy sólido) */}
          <View 
            className="bg-[#0f172a] pb-28 px-6 rounded-b-[32px] md:pb-24 shadow-sm"
            style={{ paddingTop: Math.max(insets.top, 16) + 12 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-800/80 p-2 rounded-full border border-slate-700/50">
                  <ArrowLeft size={20} color="white" />
                </TouchableOpacity>
                <View>
                  <Text className="text-white text-3xl font-extrabold tracking-tight mb-1">Exportar Reportes</Text>
                  <Text className="text-slate-400 text-sm">Genera archivos CSV de tus movimientos</Text>
                </View>
              </View>
              <View className="bg-slate-800/80 p-2.5 rounded-full border border-slate-700/50 hidden md:flex">
                <Sparkles size={20} color="#818cf8" />
              </View>
            </View>
          </View>

          <View className="px-6 -mt-16 mb-12">
            
            {/* MODO 1: Exportar transacción individual seleccionada */}
            {isSingleMode && selectedTxObj ? (() => {
              const category = getCategoryConfig(selectedTxObj.category);
              const Icon = category.icon;
              const isExpense = selectedTxObj.type === 'expense' || selectedTxObj.type === 'shared';
              
              return (
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
                  <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <Text className="text-slate-800 dark:text-slate-100 font-bold text-base">Transacción Seleccionada</Text>
                    <View className="bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                      <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">Individual</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <View className="flex-row items-center gap-3.5 flex-1">
                      <View className={`${category.bgColor} w-11 h-11 rounded-full items-center justify-center`}>
                        <Icon size={20} color={category.iconColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-800 dark:text-slate-100 font-bold text-sm" numberOfLines={1}>
                          {selectedTxObj.title}
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{selectedTxObj.date || 'Sin fecha'}</Text>
                      </View>
                    </View>
                    <Text className={`${isExpense ? 'text-rose-500' : 'text-emerald-500'} font-extrabold text-base ml-2`}>
                      {isExpense ? '-' : '+'}${selectedTxObj.amount.toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    className={`bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2 mb-4 ${isExporting ? 'opacity-70' : 'opacity-100'}`}
                    onPress={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? <ActivityIndicator color="white" /> : <Download size={20} color="white" />}
                    <Text className="text-white font-bold text-base">Exportar esta Transacción</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5"
                    onPress={() => setIsSingleMode(false)}
                  >
                    <Text className="text-slate-600 dark:text-slate-300 font-semibold text-center text-sm">Cambiar a Reporte por Rango de Fechas</Text>
                  </TouchableOpacity>
                </View>
              );
            })() : (
              
              /* MODO 2: Exportar por Rango de Fechas */
              <View className="gap-6">
                
                {/* Rango de Fechas */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
                  <Text className="text-slate-800 dark:text-slate-100 text-lg font-bold mb-4">Rango de Fechas</Text>
                  
                  {/* Presets rápidos */}
                  <View className="flex-row flex-wrap gap-2 mb-5">
                    <TouchableOpacity onPress={() => applyPreset(7)} className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">
                      <Text className="text-slate-600 dark:text-slate-350 text-xs font-semibold">7 Días</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => applyPreset(30)} className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">
                      <Text className="text-slate-600 dark:text-slate-350 text-xs font-semibold">30 Días</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => applyPreset(90)} className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">
                      <Text className="text-slate-600 dark:text-slate-350 text-xs font-semibold">90 Días</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => applyPreset('month')} className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl">
                      <Text className="text-slate-600 dark:text-slate-350 text-xs font-semibold">Este Mes</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Calendarios */}
                  <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                      <Text className="text-slate-400 dark:text-slate-500 text-xs mb-1.5 uppercase font-bold tracking-wider">Desde</Text>
                      <input
                        type="date"
                        value={startDate.toISOString().split("T")[0]}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value))}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                          color: "#334155",
                          width: "100%",
                          outline: "none"
                        }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 dark:text-slate-500 text-xs mb-1.5 uppercase font-bold tracking-wider">Hasta</Text>
                      <input
                        type="date"
                        value={endDate.toISOString().split("T")[0]}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                          color: "#334155",
                          width: "100%",
                          outline: "none"
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Resumen dinámico del reporte */}
                <View className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
                  <Text className="text-slate-800 dark:text-slate-100 text-lg font-bold mb-4">Resumen del Reporte</Text>
                  
                  {loading ? (
                    <View className="py-6 items-center">
                      <ActivityIndicator size="small" color="#0f172a" />
                    </View>
                  ) : (
                    <View className="gap-4">
                      {/* Movimientos totales */}
                      <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-500 dark:text-slate-450 font-semibold text-sm">Movimientos seleccionados</Text>
                        <Text className="text-slate-800 dark:text-slate-100 font-bold text-base">{rangeStats.totalCount}</Text>
                      </View>

                      {/* Ingresos */}
                      <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                        <View className="flex-row items-center gap-1.5">
                          <ArrowUpRight size={16} color="#10b981" />
                          <Text className="text-slate-500 dark:text-slate-450 font-semibold text-sm">Total Ingresos</Text>
                        </View>
                        <Text className="text-emerald-500 font-bold text-base">+${rangeStats.incomeTotal.toFixed(2)} ({rangeStats.incomeCount})</Text>
                      </View>

                      {/* Gastos */}
                      <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                        <View className="flex-row items-center gap-1.5">
                          <ArrowDownLeft size={16} color="#f43f5e" />
                          <Text className="text-slate-500 dark:text-slate-450 font-semibold text-sm">Total Gastos</Text>
                        </View>
                        <Text className="text-rose-500 font-bold text-base">-${rangeStats.expenseTotal.toFixed(2)} ({rangeStats.expenseCount})</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Botón de exportación */}
                <TouchableOpacity
                  className={`bg-[#0f172a] rounded-xl p-4 flex-row items-center justify-center gap-2 shadow-md ${isExporting || loading ? 'opacity-70' : 'opacity-100'}`}
                  onPress={handleExport}
                  disabled={isExporting || loading}
                >
                  {isExporting ? <ActivityIndicator color="white" /> : <Download size={20} color="white" />}
                  <Text className="text-white font-bold text-base">Generar Reporte CSV</Text>
                </TouchableOpacity>

                {/* Enlace para volver a la transacción si venía de una */}
                {transactionId && (
                  <TouchableOpacity
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5"
                    onPress={() => setIsSingleMode(true)}
                  >
                    <Text className="text-slate-600 dark:text-slate-350 font-semibold text-center text-sm">Volver a Exportación Individual</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}
