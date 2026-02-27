import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AuditLogTable = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/admin-service/admin/audit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading logs...</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-bold mb-4">System Audit Logs</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-4 border-b">Timestamp</th>
                            <th className="py-2 px-4 border-b">Action</th>
                            <th className="py-2 px-4 border-b">Entity</th>
                            <th className="py-2 px-4 border-b">Details</th>
                            <th className="py-2 px-4 border-b">Performed By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="py-2 px-4 border-b text-sm font-semibold text-blue-600">{log.action}</td>
                                <td className="py-2 px-4 border-b text-sm">{log.entityType} ({log.entityId})</td>
                                <td className="py-2 px-4 border-b text-sm text-gray-700">{log.details}</td>
                                <td className="py-2 px-4 border-b text-sm">{log.performedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogTable;
