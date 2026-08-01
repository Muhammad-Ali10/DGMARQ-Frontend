import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';

const SubscriptionCancel = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-yellow-400 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-900/20 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            Subscription Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Payment Cancelled</h3>
            <p className="text-gray-400">
              The subscription process was cancelled. No charges were made to your account.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link to="/dgmarq-plus">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Plans
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-600 text-gray-300">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCancel;
