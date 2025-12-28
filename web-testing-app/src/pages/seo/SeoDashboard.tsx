import React from 'react';
import { BarChart, Search, FileText, Activity, Globe, MapPin, Link as LinkIcon, FileBarChart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const SeoDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SEO Automation Dashboard</h1>
        <Link to="/seo/setup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Settings size={16} />
            Project Setup
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/seo/keywords" className="block">
            <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Keyword Research</h3>
                    <Search className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Research</div>
                <p className="text-xs text-gray-500">Discover new opportunities</p>
            </div>
        </Link>

        <Link to="/seo/audit" className="block">
             <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Site Audit</h3>
                    <Activity className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Health</div>
                <p className="text-xs text-gray-500">Check technical issues</p>
            </div>
        </Link>

        <Link to="/seo/content" className="block">
            <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Content Optimizer</h3>
                    <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Optimize</div>
                <p className="text-xs text-gray-500">Improve your content</p>
            </div>
        </Link>
        
        <Link to="/seo/rank-tracker" className="block">
            <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Rankings</h3>
                    <BarChart className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Track</div>
                <p className="text-xs text-gray-500">Monitor your positions</p>
            </div>
        </Link>

        <Link to="/seo/backlinks" className="block">
            <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Backlinks</h3>
                    <LinkIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Analyze</div>
                <p className="text-xs text-gray-500">Check link profile</p>
            </div>
        </Link>

        <Link to="/seo/local" className="block">
            <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Local SEO</h3>
                    <MapPin className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Local</div>
                <p className="text-xs text-gray-500">Manage GBP & Citations</p>
            </div>
        </Link>

        <Link to="/seo/reports" className="block">
            <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 h-full">
                <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Reports</h3>
                    <FileBarChart className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold">Reports</div>
                <p className="text-xs text-gray-500">Generate insights</p>
            </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <p className="text-gray-500">No recent activities.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/seo/keywords" className="block p-3 bg-gray-50 rounded hover:bg-gray-100 text-sm">Start new keyword research</Link>
            <Link to="/seo/audit" className="block p-3 bg-gray-50 rounded hover:bg-gray-100 text-sm">Run site audit</Link>
            <Link to="/seo/content" className="block p-3 bg-gray-50 rounded hover:bg-gray-100 text-sm">Create content brief</Link>
            <Link to="/seo/reports" className="block p-3 bg-gray-50 rounded hover:bg-gray-100 text-sm">Generate monthly report</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoDashboard;
