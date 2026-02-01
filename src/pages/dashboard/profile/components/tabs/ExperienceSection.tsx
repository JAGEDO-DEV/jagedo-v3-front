import { Briefcase, Award, FolderOpen, GraduationCap, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BuilderExperience } from "@/data/BuilderExperience";
import type { BuilderStatus } from "@/data/mockBuilders";
import { hasPrefilledExperience } from "@/data/BuilderExperience";

interface ExperienceSectionProps {
  experience: BuilderExperience | undefined;
  status: BuilderStatus;
  userType: string;
}

export function ExperienceSection({ experience, status, userType }: ExperienceSectionProps) {
  const isPrefilled = hasPrefilledExperience(status);
  const hasWorkExperience = experience?.workExperience && experience.workExperience.length > 0;
  const hasCertifications = experience?.certifications && experience.certifications.length > 0;
  const hasProjects = experience?.projects && experience.projects.length > 0;

  // Hardware stores don't show work experience section
  if (userType === "HARDWARE") {
    return null;
  }

  // If no experience and status doesn't require prefilled data, show empty state
  if (!isPrefilled && !hasWorkExperience && !hasCertifications && !hasProjects) {
    return (
      <Card className="mt-6 bg-white border border-gray-200 shadow-md">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-800">Experience & Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Experience Added Yet</h3>
            <p className="text-gray-500 mb-4">
              This section will be filled once the builder completes their profile.
            </p>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              <Plus className="h-4 w-4 mr-2" />
              Request Experience Update
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Work Experience */}
      <Card className="bg-white border border-gray-200 shadow-md">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-800">Work Experience</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {hasWorkExperience ? (
            <div className="space-y-6">
              {experience?.workExperience.map((work, index) => (
                <div key={work.id} className={`${index > 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{work.role}</h4>
                      <p className="text-blue-600 font-medium">{work.companyName}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{new Date(work.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} - {new Date(work.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                      <p className="text-right">{work.location}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm">{work.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No work experience added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="bg-white border border-gray-200 shadow-md">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg font-semibold text-gray-800">Certifications & Licenses</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {hasCertifications ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {experience?.certifications.map((cert) => (
                <div key={cert.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{cert.issuingBody}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Issued: {new Date(cert.issueDate).toLocaleDateString('en-GB')}
                    </span>
                    {cert.expiryDate && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Expires: {new Date(cert.expiryDate).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                  {cert.certificateNumber && (
                    <p className="mt-2 text-xs text-gray-500">Cert #: {cert.certificateNumber}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No certifications added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="bg-white border border-gray-200 shadow-md">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold text-gray-800">Notable Projects</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {hasProjects ? (
            <div className="space-y-4">
              {experience?.projects.map((project) => (
                <div key={project.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{project.projectName}</h4>
                      <p className="text-sm text-gray-600">Client: {project.clientName}</p>
                    </div>
                    <div className="text-sm text-right">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                        {project.duration}
                      </span>
                      {project.value && (
                        <p className="mt-1 font-medium text-green-600">{project.value}</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 text-sm">{project.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No projects added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Education & Additional Skills */}
      {(experience?.education || (experience?.additionalSkills && experience.additionalSkills.length > 0)) && (
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg font-semibold text-gray-800">Education & Skills</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {experience?.education && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-1">Education</h4>
                <p className="text-gray-600">{experience.education}</p>
              </div>
            )}
            {experience?.additionalSkills && experience.additionalSkills.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Additional Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {experience.additionalSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
