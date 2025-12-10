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
    // TODO: 串接 API 取得行程詳細資料
    // 目前用 mock 資料
    setTrip({
      id,
      tripName: '台北陽明山一日遊',
      startDate: '2025-11-15',
      endDate: '2025-11-15',
      departureLocation: '台北車站',
      destination: '陽明山國家公園',
      estimatedPassengers: 42,
      actualPassengers: 38,
      description: '陽明山賞花一日遊，包含竹子湖海芋季',
      contactPerson: '王小明',
      contactPhone: '0912-345-678',
      status: 'confirmed',
      tripType: 'round_trip',
      boardingMode: 'assigned',
      segments: [
        {
          id: 1,
          type: 'outbound',
          date: '2025-11-15',
          time: '08:00',
          stations: [
            { id: 1, name: '台北車站', type: 'pickup', stopDuration: 0 },
            { id: 4, name: '西門町', type: 'pickup', stopDuration: 10 },
            { id: 6, name: '陽明山國家公園', type: 'dropoff', stopDuration: 0 }
          ],
          estimatedDuration: '1.5',
          vehicleAssigned: 'ABC-1234',
          leaderAssigned: '領隊小王',
          status: 'confirmed',
          notes: ''
        }
      ]
    });
    setLoading(false);
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
