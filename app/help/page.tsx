'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  Mail,
  Phone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    question: "How do I add a new asset to the system?",
    answer: "Navigate to the Assets page and click the 'Add Asset' button. Fill in the required information including asset name, category, serial number, and purchase details. The system will automatically generate an asset ID."
  },
  {
    question: "How can I assign an asset to a user?",
    answer: "Go to the asset details page and click 'Assign Asset'. Search for the user and select them. The system will automatically update the asset status and send notifications to both the user and administrators."
  },
  {
    question: "What happens when an asset needs maintenance?",
    answer: "You can schedule maintenance from the asset details page. The system will automatically change the asset status to 'Maintenance' and send reminders based on your notification settings."
  },
  {
    question: "How do I generate reports?",
    answer: "Visit the Reports page where you can generate various types of reports including utilization, cost analysis, and compliance reports. You can schedule automatic report generation or create custom reports."
  },
  {
    question: "Can I import existing asset data?",
    answer: "Yes, you can import asset data using CSV files. Go to Settings > Import/Export and follow the template provided. The system supports bulk import with validation and error reporting."
  },
  {
    question: "How do I set up notifications?",
    answer: "Navigate to Settings > Notifications to configure email alerts, push notifications, and reminder settings. You can customize notifications for different events like asset assignments, maintenance due dates, and warranty expirations."
  }
];

const helpCategories = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of AssetFlow',
    icon: Book,
    articles: 12,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Asset Management',
    description: 'Managing your IT assets effectively',
    icon: HelpCircle,
    articles: 18,
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'User Administration',
    description: 'User roles and permissions',
    icon: MessageCircle,
    articles: 8,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    title: 'Reports & Analytics',
    description: 'Understanding your data',
    icon: Video,
    articles: 15,
    color: 'bg-orange-100 text-orange-600'
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-gray-600">Find answers and get support for AssetFlow</p>
        </div>
        <Button>
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, guides, or FAQs..."
              className="pl-12 pr-4 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {helpCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{category.description}</p>
                    <Badge variant="secondary">{category.articles} articles</Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Get help via email with detailed responses</p>
            <p className="text-sm text-gray-500 mb-4">Response time: 24 hours</p>
            <Button className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Live Chat</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Chat with our support team in real-time</p>
            <p className="text-sm text-gray-500 mb-4">Available: Mon-Fri 9AM-6PM EST</p>
            <Button className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Phone Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Speak directly with our support team</p>
            <p className="text-sm text-gray-500 mb-4">+1 (800) 555-ASSET</p>
            <Button className="w-full" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Book className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">User Guide</p>
                  <p className="text-sm text-gray-500">Complete documentation</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Video className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Video Tutorials</p>
                  <p className="text-sm text-gray-500">Step-by-step guides</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Community Forum</p>
                  <p className="text-sm text-gray-500">Connect with other users</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">API Documentation</p>
                  <p className="text-sm text-gray-500">Developer resources</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}