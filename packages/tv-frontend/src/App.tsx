import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { LayerStackProvider, LayerStackView } from '@/router';
import { Toaster } from './components/ui/toast';
import StatsConsentModal from './components/StatsConsentModal';

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster />
            <LayerStackProvider>
                <LayerStackView />
                <StatsConsentModal />
            </LayerStackProvider>
        </QueryClientProvider>
    );
}

export default App;
