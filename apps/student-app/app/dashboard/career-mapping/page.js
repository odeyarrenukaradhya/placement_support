"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { availableRoles, generateCareerRoadmap } from '@/lib/careerAI';
import { 
  Map, 
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from 'lucide-react';

const StudentCareer = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [duration, setDuration] = useState('12');
  const [roadmap, setRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedRole) return;
    
    setIsGenerating(true);
    try {
      const result = await generateCareerRoadmap(selectedRole, parseInt(duration));
      setRoadmap(result);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
    }
    setIsGenerating(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 scroll-smooth">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Career Mapping</h1>
          <p className="text-slate-500 font-medium text-lg">
            A precise, personalized roadmap for your professional success.
          </p>
        </div>

        {/* Role Selection */}
        <Card className="border-none shadow-xl shadow-blue-100/20 overflow-visible bg-white/80 backdrop-blur-xl relative z-30">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-4 text-2xl tracking-tight">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                <Target className="w-6 h-6 text-white" />
              </div>
              Define Your Career Goal
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Select a path and timeline to visualize your journey</CardDescription>
          </CardHeader>
          <CardContent className="overflow-visible pb-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Desired Role
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger placeholder="Select a career path" value={availableRoles.find(r => r.id === selectedRole)?.title} />
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Timeline (Weeks)
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger value={`${duration} weeks`} />
                  <SelectContent>
                    <SelectItem value="4">4 weeks (Fast-track)</SelectItem>
                    <SelectItem value="8">8 weeks (Standard)</SelectItem>
                    <SelectItem value="12">12 weeks (Comprehensive)</SelectItem>
                    <SelectItem value="24">24 weeks (Expertize)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!selectedRole || isGenerating}
                  className="w-full h-14 text-lg font-black rounded-[1.25rem] shadow-xl shadow-blue-200"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Generate Roadmap
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Roles Grid */}
        {!roadmap && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableRoles.map(role => (
              <Card 
                key={role.id} 
                className={`group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-2 border-slate-50 relative overflow-hidden ${
                  selectedRole === role.id ? 'ring-4 ring-blue-600/10 border-blue-600 shadow-xl' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black px-4 py-1.5 rounded-xl bg-slate-100 text-slate-500 uppercase tracking-widest">
                      {role.category}
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">{role.averageSalary}</span>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight group-hover:text-blue-600 transition-colors uppercase">{role.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-3 font-medium text-slate-500 leading-relaxed">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {role.requiredSkills.slice(0, 3).map(skill => (
                      <span 
                        key={skill}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 uppercase tracking-wider"
                      >
                        {skill}
                      </span>
                    ))}
                    {role.requiredSkills.length > 3 && (
                      <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400">
                        +{role.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Generated Roadmap */}
        {roadmap && (
          <Card className="border-none shadow-[0_32px_64px_-16px_rgba(59,130,246,0.1)] overflow-hidden bg-white rounded-[3rem]">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 p-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
                    <Map size={40} />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
                      {roadmap.role} Specialization
                    </CardTitle>
                    <CardDescription className="text-lg mt-2 font-medium text-slate-500">
                      Phase-wise execution strategy over {roadmap.duration} weeks
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setRoadmap(null)} className="rounded-[1.25rem] font-black text-xs uppercase tracking-widest px-8 py-6 border-slate-200 hover:bg-slate-50">
                  Reset Architecture
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-10 lg:p-14">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-10 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600/20 via-blue-600 to-blue-600/20 rounded-full" />
                
                <div className="space-y-16">
                  {roadmap.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="relative pl-24 group">
                      {/* Timeline dot */}
                      <div className="absolute left-11 -translate-x-1/2 w-8 h-8 rounded-2xl border-4 border-white bg-blue-600 shadow-xl shadow-blue-200 transition-all duration-500 z-10 flex items-center justify-center group-hover:rotate-45" />
                      
                      <div className="p-10 rounded-[3rem] bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-100/30 transition-all duration-700 group-hover:-translate-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black px-4 py-2 rounded-2xl bg-blue-600 text-white flex items-center gap-2 shadow-lg shadow-blue-100 uppercase tracking-widest">
                              <Clock className="w-4 h-4" />
                              WEEKS {milestone.week}
                            </span>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{milestone.title}</h4>
                          </div>
                   
                        </div>
                        
                        <p className="text-slate-500 font-medium text-lg mb-8 leading-relaxed max-w-3xl">{milestone.description}</p>
                        
                        <div className="flex flex-wrap gap-3 mb-8">
                          {milestone.skills.map(skill => (
                            <span 
                              key={skill}
                              className="text-[11px] font-black px-4 py-2 rounded-xl bg-white text-slate-700 shadow-sm border border-slate-100 uppercase tracking-wider"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 py-6 border-t border-slate-100">
                          <div className="p-3 bg-blue-50 rounded-2xl">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 tracking-tight uppercase">{milestone.resources.join(' / ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCareer;
