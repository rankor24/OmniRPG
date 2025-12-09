
import React, { useMemo } from 'react';
import type { Reflection } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-tertiary p-4 rounded-lg text-center flex flex-col justify-center h-full">
        <p className="text-3xl font-bold text-accent">{value}</p>
        <p className="text-sm text-text-secondary">{title}</p>
    </div>
);

interface DashboardViewProps {
  allReflections: Reflection[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ allReflections }) => {
    const allProposals = useMemo(() => {
        return allReflections.flatMap(r => 
            r.proposals.map(p => ({
                ...p,
                timestamp: r.timestamp,
                characterName: r.characterName,
                conversationPreview: r.conversationPreview
            }))
        );
    }, [allReflections]);

    const { stats, chartData } = useMemo(() => {
        const total = allProposals.length;
        const approved = allProposals.filter(p => p.status === 'approved').length;
        const rejected = allProposals.filter(p => p.status === 'rejected').length;
        const reviewed = approved + rejected;
        const approvalRate = reviewed > 0 ? `${((approved / reviewed) * 100).toFixed(0)}%` : 'N/A';

        const byType = allProposals.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const COLORS = ['#7F5AF0', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#f59e0b'];
        const chart = Object.entries(byType)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .map(([name, value], index) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: COLORS[index % COLORS.length] }));

        return { 
            stats: { total, approved, rejected, approvalRate, byType },
            chartData: chart
        };
    }, [allProposals]);
    
    return (
        <div className="space-y-6 pb-6 h-full flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
                <StatCard title="Total Proposals" value={stats.total} />
                <StatCard title="Approved" value={stats.approved} />
                <StatCard title="Rejected" value={stats.rejected} />
                <StatCard title="Approval Rate" value={stats.approvalRate} />
            </div>

            <div className="bg-secondary p-4 rounded-lg border border-tertiary flex-grow flex flex-col min-h-[400px]">
                <h3 className="text-lg font-semibold text-text-primary mb-3 text-center">Proposals by Type</h3>
                {chartData.length > 0 ? (
                    <div className="flex-grow min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={chartData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius="80%" 
                                    innerRadius="50%" 
                                    paddingAngle={2}
                                >
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="p-2 bg-primary/80 border border-tertiary rounded-md"><p className="label text-accent">{`${payload[0].name}: ${payload[0].value}`}</p></div> : null} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                            <p className="text-text-secondary italic">No proposals to chart yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardView;
