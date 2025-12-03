import AssetList from '@/app/(app)/assets/components/AssetList';
import Head from 'next/head';

export default function ComputerPage() {
    return (
        <>
            <Head>
                <title>Computer Assets – ITAM</title>
                <meta name="description" content="Manage and view all computer hardware assets." />
            </Head>
            <AssetList defaultCategory="computer" basePath="/assets/computer" />
        </>
    );
}
