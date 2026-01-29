import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/pages/dashboard/admin/registers/StatusBadge";
import { resolveStatus, type Builder } from "@/data/mockBuilders";

export default function BuilderProfile() {
  const { id, userType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const userData = location.state?.userData as Builder | undefined;

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Builder Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The builder profile you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = resolveStatus(userData);
  const displayName = userData.organizationName || 
    [userData.firstName, userData.lastName].filter(Boolean).join(" ") || 
    "Unknown";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="animate-fade-in">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <p className="text-muted-foreground mt-1">{userType}</p>
              </div>
              <StatusBadge status={status} className="w-fit" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Contact Information
                </h3>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{userData.email || "N/A"}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{userData.phoneNumber || "N/A"}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[userData.subCounty, userData.county].filter(Boolean).join(", ") || "N/A"}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined: {userData.createdAt 
                      ? new Date(userData.createdAt).toLocaleDateString("en-GB") 
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Professional Details
                </h3>
                
                {userData.skills && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Skill: {userData.skills}</span>
                  </div>
                )}
                
                {userData.specialization && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Specialization: {userData.specialization}</span>
                  </div>
                )}
                
                {userData.grade && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Grade: {userData.grade}</span>
                  </div>
                )}
                
                {userData.experience && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Experience: {userData.experience}</span>
                  </div>
                )}
                
                {userData.profession && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Profession: {userData.profession}</span>
                  </div>
                )}
                
                {userData.level && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Level: {userData.level}</span>
                  </div>
                )}
                
                {userData.contractorTypes && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Contractor Type: {userData.contractorTypes}</span>
                  </div>
                )}
                
                {userData.hardwareTypes && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Hardware Type: {userData.hardwareTypes}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
