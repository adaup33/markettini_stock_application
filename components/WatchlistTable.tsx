'use client';

import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const WatchlistTable = () => {
    const sampleData = [
        {
            company: 'Apple Inc.',
            symbol: 'AAPL',
            price: '$175.43',
            change: '+2.45%',
            marketCap: '$2.75T',
            peRatio: '28.5',
            alert: 'None',
            action: 'View'
        },
        {
            company: 'Microsoft Corporation',
            symbol: 'MSFT',
            price: '$378.91',
            change: '+1.23%',
            marketCap: '$2.81T',
            peRatio: '35.2',
            alert: 'Active',
            action: 'View'
        },
        {
            company: 'Tesla, Inc.',
            symbol: 'TSLA',
            price: '$242.84',
            change: '-0.89%',
            marketCap: '$771B',
            peRatio: '67.8',
            alert: 'None',
            action: 'View'
        },
    ];

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        {WATCHLIST_TABLE_HEADER.map((header) => (
                            <TableHead key={header} className="text-left">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sampleData.map((row) => (
                        <TableRow key={row.symbol}>
                            <TableCell className="text-left">{row.company}</TableCell>
                            <TableCell className="text-left">{row.symbol}</TableCell>
                            <TableCell className="text-left">{row.price}</TableCell>
                            <TableCell className="text-left">{row.change}</TableCell>
                            <TableCell className="text-left">{row.marketCap}</TableCell>
                            <TableCell className="text-left">{row.peRatio}</TableCell>
                            <TableCell className="text-left">{row.alert}</TableCell>
                            <TableCell className="text-left">{row.action}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default WatchlistTable;
