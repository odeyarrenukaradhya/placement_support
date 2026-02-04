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
  SelectTrigger
} from '@/components/ui';
import { availableRoles, generateCareerRoadmap } from '@/lib/careerAI';
import {
  Map,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  MapPin
} from 'lucide-react';

const StudentCareer = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [duration, setDuration] = useState('12');
  const [roadmap, setRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  const handleGenerate = async () => {
    if (!selectedRole) return;

    setIsGenerating(true);
    try {
      const result = await generateCareerRoadmap(selectedRole, parseInt(duration));
      setRoadmap(result);
      setExpandedMilestone(null);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
    }
    setIsGenerating(false);
  };

  const toggleMilestone = (id) => {
    setExpandedMilestone(expandedMilestone === id ? null : id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">Career Mapping</h1>
          <p className="text-muted-foreground mt-2 text-lg text-black">
            Get a personalized roadmap to achieve your career goals
          </p>
        </div>

        {/* Phase 2 Notice */}
        {!roadmap && (
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-500 mb-1">AI-Powered Career Guidance</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This feature uses AI to generate personalized career roadmaps targeted to your specific goals.
                    Currently validating with demo data. Full AI integration arriving in Phase 2.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Selection */}
        {!roadmap && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-5 h-5 text-primary" />
                Select Your Goal
              </CardTitle>
              <CardDescription>Choose a career path and your available timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-">
                    Desired Role
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger placeholder="Select a role" className="h-11" />
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Timeline (Weeks)
                  </label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger placeholder="Select duration" className="h-11" />
                    <SelectContent>
                      <SelectItem value="4">4 weeks (Accelerated)</SelectItem>
                      <SelectItem value="8">8 weeks (Balanced)</SelectItem>
                      <SelectItem value="12">12 weeks (Standard)</SelectItem>
                      <SelectItem value="24">24 weeks (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedRole || isGenerating}
                    className="w-full h-11 text-base font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Roadmap
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Roles Grid - Helper for selection */}
        {!roadmap && !selectedRole && (
          <div className="grid md:grid-cols-2 gap-4">
            {availableRoles.map(role => (
              <Card
                key={role.id}
                className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {role.category}
                    </span>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {role.averageSalary}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {role.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {role.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {role.requiredSkills.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                    {role.requiredSkills.length > 3 && (
                      <span className="text-xs px-2 py-1 text-muted-foreground">
                        +{role.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Generated Roadmap View */}
        {roadmap && (
          <div className="space-y-6">
            {/* Roadmap Header Card */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Map className="w-6 h-6 text-primary" />
                      Your {roadmap.role} Roadmap
                    </CardTitle>
                    <CardDescription className="mt-1 text-base">
                      A structured {roadmap.duration}-week journey to becoming a professional {roadmap.role}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setRoadmap(null)} className="gap-2">
                    Generate New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {roadmap.description}
                </p>

                {roadmap.youtubeResources && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Recommended Video Courses
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {roadmap.youtubeResources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-red-600 border-b-[5px] border-b-transparent ml-0.5" />
                          </div>
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {resource.title}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Content */}
            <div className="relative pl-4 md:pl-8">
              {/* Road Design */}
              <div className="absolute left-[21px] md:left-[37px] top-4 bottom-12 w-4 bg-slate-200 rounded-full border border-slate-300 shadow-inner flex flex-col items-center py-2">
                <div className="h-full w-0 border-r-2 border-dashed border-white/80" />
              </div>

              <div className="space-y-8">
                {roadmap.milestones.map((milestone, index) => {
                  const isExpanded = expandedMilestone === milestone.id;

                  return (
                    <div key={milestone.id} className="relative pl-12">
                      {/* Map Pin Marker */}
                      <div className={`absolute left-[15px] top-5 z-10 bg-background ring-4 ring-background rounded-full ${milestone.completed ? 'text-blue-600' : 'text-slate-300'}`}>
                        <MapPin className={`w-7 h-7 ${milestone.completed ? 'fill-blue-100' : 'fill-slate-100'}`} />
                      </div>

                      {/* Milestone Card */}
                      <div
                        onClick={() => toggleMilestone(milestone.id)}
                        className={`bg-slate-50/80 hover:bg-slate-50 border rounded-xl p-6 transition-all cursor-pointer hover:shadow-md ${milestone.completed ? 'border-slate-100' : 'border-slate-100 opacity-90'
                          } ${isExpanded ? 'ring-2 ring-primary/20 shadow-lg scale-[1.01]' : ''}`}
                      >
                        {/* Week Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100/50 text-blue-700 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {milestone.week}
                          </div>
                          {isExpanded ? (
                            <span className="text-xs font-medium text-primary">Less Details</span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">Click for Details</span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              {milestone.title}
                            </h3>
                            <p className="text-slate-600 mt-1 leading-relaxed">
                              {milestone.overview}
                            </p>
                          </div>

                          {/* Expanded Details: Daily Plan */}
                          {isExpanded && milestone.tasks?.[0]?.dailyPlan && (
                            <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Daily Action Plan
                              </h4>
                              <div className="grid sm:grid-cols-2 gap-2">
                                {milestone.tasks[0].dailyPlan.map((plan, idx) => (
                                  <div
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const el = document.getElementById(`day-detail-${milestone.id}-${idx}`);
                                      if (el) {
                                        el.classList.toggle('hidden');
                                      }
                                    }}
                                    className="flex flex-col gap-1 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100/50 cursor-pointer hover:border-blue-200 transition-colors"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="font-bold text-blue-600 min-w-[3.5rem] text-xs shrink-0">
                                        {plan.day || `Day ${idx + 1}`}:
                                      </span>
                                      <span className="font-medium text-slate-800">{plan.topic || plan}</span>
                                    </div>
                                    <div id={`day-detail-${milestone.id}-${idx}`} className="hidden pl-16 text-xs text-slate-600 mt-1 italic animate-in fade-in bg-slate-50 p-2 rounded-md border border-slate-100">
                                      {plan.detail || "No details available."}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skills and Resources */}
                          <div className="pt-4 flex flex-col gap-4 border-t border-slate-100/50">
                            <div className="flex flex-wrap gap-2">
                              {milestone.skills.map(skill => (
                                <span
                                  key={skill.name}
                                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100/50"
                                >
                                  {skill.name}
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground min-w-fit">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Resources:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {milestone.resources.map((resource, idx) => (
                                  <div key={idx} className="flex items-center">
                                    {resource.url ? (
                                      <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors flex items-center gap-1"
                                      >
                                        {resource.title}
                                        <ArrowRight className="w-3 h-3 opacity-50 -rotate-45" />
                                      </a>
                                    ) : (
                                      <span className="text-slate-600 font-medium">
                                        {resource.title}
                                      </span>
                                    )}
                                    {idx < milestone.resources.length - 1 && (
                                      <span className="mx-2 text-slate-300">•</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCareer;