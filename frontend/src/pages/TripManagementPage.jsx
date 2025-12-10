import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { tripService } from '../services/busService';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import StationManager from '../components/StationManager';

// Helper: 驗證行程資料完整性（狀態流轉前必須有車輛、領隊、站點等）
function validateTripData(trip) {
  if (!trip.tripName || !trip.startDate || !trip.endDate || !trip.departureLocation || !trip.destination) {
    return '行程基本資料不完整';
  }
  if (!trip.segments || trip.segments.length === 0) {
    return '至少需要一個段次';
  }
  // 可擴充：檢查車輛、領隊、站點等
  return null;
}

const TripManagementPage = () => {
  const navigate = useNavigate();
  // 刪除相關狀態
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(null);

  // 取消行程（軟刪除）
  const handleCancelTrip = async () => {
    if (!deletingTrip) return;
    try {
      // 串 API，呼叫 tripService.updateTrip({ ...deletingTrip, status: 'cancelled' })
      await tripService.updateTrip({ ...deletingTrip, status: 'cancelled' });
      setTrips(prev => prev.map(t => t.id === deletingTrip.id ? { ...t, status: 'cancelled' } : t));
      setShowDeleteModal(false);
      setDeletingTrip(null);
    } catch (err) {
      alert('取消失敗，請稍後再試');
    }
  };

  // 還原行程
  const handleRestoreTrip = async (trip) => {
    try {
      await tripService.updateTrip({ ...trip, status: 'draft' });
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'draft' } : t));
    } catch (err) {
      alert('還原失敗，請稍後再試');
    }
  };

  // 分頁、搜尋、篩選狀態
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // 新增：多日行程欄位
  const [formData, setFormData] = useState({
    tripName: '',
    startDate: '',
    endDate: '',
    departureLocation: '',
    destination: '',
    estimatedPassengers: 40,
    description: '',
    contactPerson: '',
    contactPhone: '',
    status: 'draft',
    tripType: 'round_trip', // 'round_trip', 'one_way', 'multi_day'
    boardingMode: 'assigned', // 'assigned', 'free'
    segments: [
      {
        id: 1,
        type: 'outbound',
        date: '',
        time: '08:00',
        stations: [],
        estimatedDuration: '2',
        notes: ''
      }
    ]
  });

  // ...existing config arrays (tripTypes, boardingModes, segmentTypes, statusOptions, mockTrips)...

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await tripService.getTrips();
        // map backend fields to frontend expected shape where possible
        const mapped = (data || []).map(t => ({
          id: t.id,
          tripName: t.name || t.tripName,
          startDate: t.startDate || t.date,
          endDate: t.endDate || t.date,
          departureLocation: t.departureLocation || t.departure || '',
          destination: t.destination || '',
          estimatedPassengers: t.totalCapacity || t.estimatedPassengers || 0,
          actualPassengers: t.totalOnBoard || t.actualPassengers || 0,
          description: t.description || '',
          contactPerson: t.contactPerson || '',
          contactPhone: t.contactPhone || '',
          status: t.status || 'draft',
          tripType: t.tripType || 'round_trip',
          boardingMode: t.boardingMode || (t.buses && t.buses.length ? 'assigned' : 'free'),
          segments: t.segments || []
        }));
        if (mounted) setTrips(mapped.length ? mapped : []);
      } catch (err) {
        console.error('Failed to load trips', err);
        if (mounted) setTrips([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // 新增：前端建立行程前驗證資料完整性
  const handleCreateTrip = (e) => {
    e.preventDefault();
    const errMsg = validateTripData(formData);
    if (errMsg) {
      alert(errMsg);
      return;
    }
    (async () => {
      try {
        const payload = {
          tripName: formData.tripName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          direction: 'outbound',
          description: formData.description,
          status: 'draft',
          departureLocation: formData.departureLocation,
          destination: formData.destination,
          estimatedPassengers: formData.estimatedPassengers,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          tripType: formData.tripType,
          boardingMode: formData.boardingMode,
          segments: formData.segments
        };
        const created = await tripService.createTrip(payload);
        const mapped = {
          id: created.id,
          tripName: created.name || formData.tripName,
          startDate: created.startDate || formData.startDate,
          endDate: created.endDate || formData.endDate,
          departureLocation: formData.departureLocation,
          destination: formData.destination,
          estimatedPassengers: formData.estimatedPassengers,
          actualPassengers: 0,
          description: created.description || formData.description,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          status: created.status || 'draft',
          tripType: formData.tripType,
          boardingMode: formData.boardingMode,
          segments: formData.segments
        };
        setTrips(prev => [mapped, ...prev]);
        setShowCreateForm(false);
        resetForm();
      } catch (err) {
        console.error('Create trip failed', err);
        alert('建立行程失敗，請確認是否有權限或稍後再試');
      }
    })();
  };

  // ...existing segment/route/station management functions...

  // 新增：分頁、搜尋、篩選後的 trips
  const filteredTrips = trips
    .filter(t =>
      (!keyword || t.tripName.includes(keyword) || t.destination.includes(keyword)) &&
      (!filterStatus || t.status === filterStatus)
    );
  const totalPages = Math.ceil(filteredTrips.length / pageSize);
  const pagedTrips = filteredTrips.slice((page - 1) * pageSize, page * pageSize);

  // ...existing UI rendering code...

  // 新增：loading 狀態顯示
  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-center text-gray-500">載入中...</div>
      </Layout>
    );
  }

  // ...existing return JSX (表單、列表、分頁、詳細展開、Modal等)...
  // 在行程列表 render 區塊加上：
  // {/* 無資料提示，避免空白畫面 */}
  // {!loading && pagedTrips.length === 0 && (
  //   <div className="text-center text-gray-500 py-12">目前尚無行程，請點右上「新增行程」建立。</div>
  // )}

};

export default TripManagementPage;