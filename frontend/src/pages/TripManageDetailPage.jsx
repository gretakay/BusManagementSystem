import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../services/busService';
import Layout from '../components/Layout';
import StationManager from '../components/StationManager';
import { Button } from '../components/ui/Button';

const TripManageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    tripService.getTripById(id)
      .then(data => {
        // 轉換 API 回傳資料格式為前端顯示格式
        const tripData = {
          id: data.id || data.Id,
          tripName: data.name || data.Name,
          startDate: data.startDate || data.StartDate,
          endDate: data.endDate || data.EndDate,
          departureLocation: data.departureLocation || data.DepartureLocation,
          destination: data.destination || data.Destination,
          estimatedPassengers: data.estimatedPassengers || data.EstimatedPassengers,
          actualPassengers: data.actualPassengers || data.ActualPassengers,
          description: data.description || data.Description,
          contactPerson: data.contactPerson || data.ContactPerson,
          contactPhone: data.contactPhone || data.ContactPhone,
          status: (data.status || data.Status || '').toLowerCase(),
          tripType: data.tripType || data.TripType,
          boardingMode: data.boardingMode || data.BoardingMode,
          segments: (data.segments || data.Segments || []).map(seg => ({
            id: seg.id || seg.Id,
            type: seg.type || seg.Type,
            date: seg.date || seg.Date,
            time: seg.time || seg.Time,
            stations: (seg.stations || seg.Stations || []).map(st => ({
              id: st.id || st.Id,
              name: st.name || st.Name,
              type: st.type || st.Type,
              stopDuration: st.stopDuration || st.StopDuration || 0
            })),
            estimatedDuration: seg.estimatedDuration || seg.EstimatedDuration,
            vehicleAssigned: seg.vehicleAssigned || seg.VehicleAssigned,
            leaderAssigned: seg.leaderAssigned || seg.LeaderAssigned,
            status: (seg.status || seg.Status || '').toLowerCase(),
            notes: seg.notes || seg.Notes || ''
          }))
        };
        setTrip(tripData);
      })
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="p-6">載入中...</div></Layout>;
  if (!trip) return <Layout><div className="p-6">找不到行程</div></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">行程詳細管理</h1>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><b>行程名稱：</b>{trip.tripName}</div>
            <div><b>日期：</b>{trip.startDate} ~ {trip.endDate}</div>
            <div><b>出發地：</b>{trip.departureLocation}</div>
            <div><b>目的地：</b>{trip.destination}</div>
            <div><b>預估人數：</b>{trip.estimatedPassengers}</div>
            <div><b>實際人數：</b>{trip.actualPassengers}</div>
            <div><b>聯絡人：</b>{trip.contactPerson}</div>
            <div><b>聯絡電話：</b>{trip.contactPhone}</div>
            <div><b>狀態：</b>{trip.status}</div>
            <div><b>描述：</b>{trip.description}</div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">段次與站點</h2>
            {trip.segments.map(segment => (
              <div key={segment.id} className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="mb-2 font-medium">{segment.type} - {segment.date} {segment.time}</div>
                <div className="mb-2">車輛：{segment.vehicleAssigned} 領隊：{segment.leaderAssigned}</div>
                <div className="mb-2">預估車程：{segment.estimatedDuration} 小時</div>
                <div className="mb-2">站點：</div>
                <ul className="ml-4 list-disc">
                  {segment.stations.map((s, i) => (
                    <li key={i}>{s.name}（{s.type === 'pickup' ? '上車' : '下車'}{s.stopDuration ? `，停留${s.stopDuration}分鐘` : ''}）</li>
                  ))}
                </ul>
                <div className="mt-2 text-sm text-gray-500">備註：{segment.notes}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TripManageDetailPage;
