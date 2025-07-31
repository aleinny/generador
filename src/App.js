import React, { useState, useEffect } from 'react';
import { Download, Settings, FileText, AlertCircle, CheckCircle, RefreshCw, Database, Users, Shield, Archive } from 'lucide-react';

const API_BASE_URL = 'https://ejecutable-toggles-wqhx.vercel.app';

const PensionDataApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [businessRules, setBusinessRules] = useState({});
  const [rulesStats, setRulesStats] = useState({ total_rules: 0, active_rules: 0, inactive_rules: 0 });
  const [systemInfo, setSystemInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Estados para formularios
  const [csvRequest, setCsvRequest] = useState({
    id_cotizacion_inicial: 1,
    id_cotizacion_final: 100
  });
  
  const [bundleRequest, setBundleRequest] = useState({
    total_cotizaciones: 1000,
    total_grupos: 100
  });

  // Función para mostrar notificaciones
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Función para mostrar modal de confirmación
  const showConfirm = (message, onConfirm) => {
    setConfirmAction({ message, onConfirm });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction?.onConfirm) {
      confirmAction.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadBusinessRules();
    loadSystemInfo();
    loadFiles();
  }, []);

  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      addNotification(`Error: ${error.message}`, 'error');
      throw error;
    }
  };

  const loadBusinessRules = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/business-rules');
      setBusinessRules(data.rules);
      setRulesStats({
        total_rules: data.total_rules,
        active_rules: data.active_rules,
        inactive_rules: data.inactive_rules
      });
    } catch (error) {
      console.error('Error loading business rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const data = await apiCall('/api/business-rules/info');
      setSystemInfo(data);
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const data = await apiCall('/api/files');
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const updateBusinessRule = async (ruleName, value) => {
    try {
      setBusinessRules(prev => ({ ...prev, [ruleName]: value }));
      
      const updateData = { [ruleName]: value };
      await apiCall('/api/business-rules', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      addNotification(`Regla ${ruleName} actualizada correctamente`, 'success');
      await loadBusinessRules();
    } catch (error) {
      setBusinessRules(prev => ({ ...prev, [ruleName]: !value }));
      addNotification(`Error actualizando regla: ${error.message}`, 'error');
    }
  };

  const resetBusinessRules = async () => {
    showConfirm(
      '¿Estás seguro de restaurar todas las reglas a sus valores por defecto?',
      async () => {
        setLoading(true);
        try {
          await apiCall('/api/business-rules/reset', { method: 'POST' });
          addNotification('Reglas restauradas a valores por defecto', 'success');
          await loadBusinessRules();
        } catch (error) {
          addNotification(`Error restaurando reglas: ${error.message}`, 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const generateCSV = async () => {
    if (csvRequest.id_cotizacion_inicial >= csvRequest.id_cotizacion_final) {
      addNotification('El ID inicial debe ser menor que el ID final', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate/download_csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(csvRequest)
      });

      if (!response.ok) throw new Error('Error generando CSV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `pensiones_${csvRequest.id_cotizacion_inicial}_${csvRequest.id_cotizacion_final}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      addNotification('CSV generado y descargado correctamente', 'success');
      await loadFiles();
    } catch (error) {
      addNotification(`Error generando CSV: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateBundle = async () => {
    if (bundleRequest.total_cotizaciones <= 0 || bundleRequest.total_grupos <= 0) {
      addNotification('Los valores deben ser mayores a 0', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate/download_final_bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundleRequest)
      });

      if (!response.ok) throw new Error('Error generando bundle');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bundle_pensiones_${bundleRequest.total_cotizaciones}_registros.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      addNotification('Bundle ZIP generado y descargado correctamente', 'success');
      await loadFiles();
    } catch (error) {
      addNotification(`Error generando bundle: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatRuleName = (ruleName) => {
    return ruleName
      .replace(/^rule_\d+_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRuleDescription = (ruleName) => {
    const descriptions = {
      rule_01_max_age_100_alert: "Previene la generación de personas con más de 100 años",
      rule_03_pcl_obligatorio: "PCL obligatorio para pensiones de invalidez",
      rule_04_inv_sbv_fields: "Campos específicos para INV y SBV",
      rule_05_vejez_fields: "Campos específicos para vejez",
      rule_06_civil_status_causante_only: "Estado civil solo para causantes",
      rule_07_date_format_yyyy_mm_dd: "Formato de fecha YYYY-MM-DD",
      rule_08_51_event_after_birth: "Fecha de evento posterior al nacimiento",
      rule_09_parent_child_birth_date: "Diferencia de edad padre-hijo mínima 12 años",
      rule_10_hijo_derecho_max_25_valido: "Hijos válidos pierden derecho después de 25 años",
      rule_11_sbv_sin_beneficiarios_no_permitido: "SBV debe tener beneficiarios",
      rule_13_16_normalize_text: "Normalización de texto (mayúsculas, sin tildes)",
      rule_17_smlv_range: "Rango de pensión entre 1 y 25 SMLV",
      rule_21_22_civil_status_logic: "Lógica de estado civil y cónyuge",
      rule_27_mesadas_cutoff_date: "Corte de mesadas por fecha",
      rule_30_id_format: "Formato válido de identificación",
      rule_32_doc_type_age_consistency: "Consistencia tipo documento y edad",
      rule_68_no_same_sex_spouse: "Causante y cónyuge de diferente sexo",
      rule_70_conyuge_menor_con_hijos_vitalicia: "Cónyuge menor con hijos: temporalidad vitalicia"
    };
    return descriptions[ruleName] || "Regla de negocio del sistema";
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Total Reglas</h3>
              <p className="text-3xl font-bold text-blue-600">{rulesStats.total_rules}</p>
            </div>
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Reglas Activas</h3>
              <p className="text-3xl font-bold text-green-600">{rulesStats.active_rules}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-900">Reglas Inactivas</h3>
              <p className="text-3xl font-bold text-red-600">{rulesStats.inactive_rules}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
      </div>

      {systemInfo && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Información del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Entorno:</span>
              <span className="ml-2 text-gray-900">{systemInfo.environment || 'Producción'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Estado API:</span>
              <span className="ml-2 text-green-600">✓ Operacional</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('rules')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Settings className="h-5 w-5 mr-2" />
            <span className="font-medium">Configurar Reglas</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Download className="h-5 w-5 mr-2" />
            <span className="font-medium">Generar Datos</span>
          </button>
        </div>
      </div>
    </div>
  );

  const BusinessRulesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reglas de Negocio</h2>
        <button
          onClick={resetBusinessRules}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Restaurar Defecto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              {rulesStats.active_rules} de {rulesStats.total_rules} reglas activas
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(rulesStats.active_rules / rulesStats.total_rules) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">
                {Math.round((rulesStats.active_rules / rulesStats.total_rules) * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(businessRules).map(([ruleName, isActive]) => (
            <div key={ruleName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{formatRuleName(ruleName)}</h4>
                <p className="text-sm text-gray-600 mt-1">{getRuleDescription(ruleName)}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => updateBusinessRule(ruleName, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const GenerateDataTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Generar Datos de Pensiones</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Generar CSV Individual
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Cotización Inicial
              </label>
              <input
                type="number"
                value={csvRequest.id_cotizacion_inicial}
                onChange={(e) => setCsvRequest(prev => ({ ...prev, id_cotizacion_inicial: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Cotización Final
              </label>
              <input
                type="number"
                value={csvRequest.id_cotizacion_final}
                onChange={(e) => setCsvRequest(prev => ({ ...prev, id_cotizacion_final: parseInt(e.target.value) || 100 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            <button
              onClick={generateCSV}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generar CSV
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Archive className="h-5 w-5 mr-2 text-purple-600" />
            Generar Bundle ZIP
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cotizaciones
              </label>
              <input
                type="number"
                value={bundleRequest.total_cotizaciones}
                onChange={(e) => setBundleRequest(prev => ({ ...prev, total_cotizaciones: parseInt(e.target.value) || 1000 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registros por Grupo (máx. 250)
              </label>
              <input
                type="number"
                value={bundleRequest.total_grupos}
                onChange={(e) => setBundleRequest(prev => ({ ...prev, total_grupos: Math.min(parseInt(e.target.value) || 100, 250) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min="1"
                max="250"
              />
            </div>
            <button
              onClick={generateBundle}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Generar Bundle ZIP
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const FilesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Archivos Generados</h2>
        <button
          onClick={loadFiles}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {files.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay archivos disponibles</h3>
            <p className="text-gray-600">Los archivos generados aparecerán aquí.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name || `Archivo ${index + 1}`}</p>
                    <p className="text-sm text-gray-500">{file.size || 'Tamaño desconocido'}</p>
                  </div>
                </div>
                <button className="flex items-center px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-md text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Acción</h3>
            <p className="text-gray-600 mb-6">{confirmAction?.message}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium rounded-lg transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-100 border border-red-200 text-red-800' :
              'bg-blue-100 border border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Generador de Datos de Pensiones</h1>
              <p className="text-blue-100">Sistema de generación y gestión de datos de pensiones</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                API Conectada
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Database },
              { id: 'rules', label: 'Reglas de Negocio', icon: Settings },
              { id: 'generate', label: 'Generar Datos', icon: Download },
              { id: 'files', label: 'Archivos', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'rules' && <BusinessRulesTab />}
        {activeTab === 'generate' && <GenerateDataTab />}
        {activeTab === 'files' && <FilesTab />}
      </main>
    </div>
  );
};

export default PensionDataApp;