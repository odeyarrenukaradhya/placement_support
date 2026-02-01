"use client";

import React from 'react';

const PieChart = ({ data, title }) => {
    // data format: [{label: 'A', value: 30, color: 'text-blue-500'}, ...]

    const total = data.reduce((acc, item) => acc + item.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map((slice, i) => {
        const startPercent = cumulativePercent;
        const slicePercent = slice.value / total;
        cumulativePercent += slicePercent;
        const endPercent = cumulativePercent;

        // Calculate path
        const [startX, startY] = getCoordinatesForPercent(startPercent);
        const [endX, endY] = getCoordinatesForPercent(endPercent);
        const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

        const pathData = [
            `M 0 0`,
            `L ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
        ].join(' ');

        return (
            <path
                key={i}
                d={pathData}
                fill="currentColor"
                className={`${slice.color} hover:opacity-80 transition-opacity cursor-pointer`}
            />
        );
    });

    return (
        <div className="flex flex-col items-center h-full">
            {title && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 w-full">{title}</h3>}
            <div className="flex-1 w-full flex items-center justify-center gap-8">
                {/* Chart SVG */}
                <div className="relative w-40 h-40">
                    <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90 text-blue-500 overflow-visible">
                        {slices}
                        {/* Center Hole for Donut Text */}
                        <circle cx="0" cy="0" r="0.6" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-black text-slate-800">{total}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.bgClass || item.color.replace('text-', 'bg-')}`}></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                <span className="text-[10px] font-medium text-slate-400">
                                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PieChart;
