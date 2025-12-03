import AssetList from '@/app/(app)/assets/components/AssetList';
import Head from 'next/head';

export default function NetworkPage() {
    return (
        <>
            <Head>
                <title>Network Assets – ITAM</title>
                <meta name="description" content="Manage and view all network hardware assets." />
            </Head>
            <AssetList defaultCategory="network" basePath="/assets/network" />
        </>
    );
}
