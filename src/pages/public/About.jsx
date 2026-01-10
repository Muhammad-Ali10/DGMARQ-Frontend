import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Shield, ShoppingBag, TrendingUp, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">About DGMARQ</h1>
          <p className="text-xl text-gray-400">
            Your trusted marketplace for digital products
          </p>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#041536] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Who We Are</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                DGMARQ is a leading digital marketplace platform that connects buyers and sellers 
                of digital products, including software licenses, game keys, digital services, and more. 
                We provide a secure, fast, and reliable platform for digital transactions.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#041536] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                To provide the best digital marketplace experience with secure transactions, 
                instant delivery, competitive pricing, and exceptional customer support.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#041536] border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-white">Secure & Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  All transactions are protected with industry-standard security measures and buyer protection policies.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#041536] border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-white">Wide Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Browse thousands of verified digital products from trusted sellers worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#041536] border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-white">Best Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Competitive pricing with regular deals, bundle offers, and exclusive discounts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#041536] border-gray-700">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-white">Trusted Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Join thousands of satisfied customers and verified sellers in our growing community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

