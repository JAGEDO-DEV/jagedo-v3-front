/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TiTick } from "react-icons/ti";
import { AttachmentsSection } from "@/components/Attachments";
import type { UploadedFile } from "@/utils/fileUpload";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { useState } from "react"

interface ProfessionalFormProps {
    formData: any;
    handleInputChange: (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => void;
    handleDateChange: (date: Date | null) => void;
    setSelectedPlan: (plan: string | null) => void;
    setAcceptedPolicy: (accepted: boolean) => void;
    handleSubmit: (e: React.FormEvent) => void;
    isFormValid: () => boolean;
    isSubmitting: boolean;
    selectedPlan: string | null;
    acceptedPolicy: boolean;
    attachments: UploadedFile[];
    uploadingFiles: string[];
    editingFile: string | null;
    editingFileName: string;
    handleFileUpload: (uploadedFile: UploadedFile) => void;
    removeAttachment: (index: number) => void;
    startEditingFile: (index: number) => void;
    saveEditingFileName: (index: number) => void;
    cancelEditingFileName: () => void;
    setEditingFileName: (name: string) => void;
}

function getEarliestStartDate(requestTime: Date): Date {
    const cutoffHour = 8;
    const earliest = new Date(requestTime);

    if (requestTime.getHours() < cutoffHour) {
        earliest.setDate(earliest.getDate() + 7);
    } else {
        earliest.setDate(earliest.getDate() + 8);
    }

    earliest.setHours(8, 0, 0, 0);
    return earliest;
}

export const ProfessionalForm: React.FC<ProfessionalFormProps> = ({
    formData,
    handleInputChange,
    handleDateChange,
    setSelectedPlan,
    setAcceptedPolicy,
    handleSubmit,
    isFormValid,
    isSubmitting,
    selectedPlan,
    acceptedPolicy,
    attachments,
    uploadingFiles,
    editingFile,
    editingFileName,
    handleFileUpload,
    removeAttachment,
    startEditingFile,
    saveEditingFileName,
    cancelEditingFileName,
    setEditingFileName
}) => {
    
    const now = new Date();
    const earliest = getEarliestStartDate(now);
    const professions = [
  "Architect",
  "Construction Manager",
  "Electrical Engineer",
  "Environment Officer",
  "Geotechnical Engineer",
  "Geologist",
  "Hydrologist",
  "Interior Designer",
  "Land Surveyor",
  "Landscape Architect",
  "Mechanical Engineer",
  "Project Manager",
  "Quantity Surveyor",
  "Roads Engineer",
  "Safety Officer",
  "Structural Engineer",
  "Topo Surveyor",
  "Water Engineer"
]

const [search, setSearch] = useState("")

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2 space-y-6 animate-fade-in-up bg-white">
                    <Card className="border-none">
                        <CardContent className="pt-6 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="profession"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Select Profession
                                        </label>
                                       
                                           <Select
                                            value={formData.skill}
                                            onValueChange={(value) =>
                                                handleInputChange({
                                                target: {
                                                    name: "skill",
                                                    value
                                                }
                                                } as any)
                                            }
                                            >
                                            <SelectTrigger
                                                id="profession"
                                                className="w-full border border-gray-200"
                                            >
                                                <SelectValue placeholder="Select a profession" />
                                            </SelectTrigger>

                                            <SelectContent className="bg-white">
                                                {/* Search box */}
                                                <div className="p-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search profession..."
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                                </div>

                                                {/* Scrollable list */}
                                                <div className="max-h-60 overflow-y-auto">
                                                {professions
                                                    .filter((profession) =>
                                                    profession.toLowerCase().includes(search.toLowerCase())
                                                    )
                                                    .map((profession) => (
                                                    <SelectItem key={profession} value={profession}>
                                                        {profession}
                                                    </SelectItem>
                                                    ))}
                                                </div>
                                            </SelectContent>
                                            </Select>

                                            
                                        
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="location"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Location
                                        </label>
                                        <LocationAutocomplete
                                            value={formData.location}
                                            onChange={(value) =>
                                                handleInputChange({
                                                    target: { name: "location", value },
                                                } as any)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="startDate"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Start Date
                                        </label>
                                        <DatePicker
                                            date={formData.startDate}
                                            setDate={handleDateChange}
                                            earliestDate={earliest}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="description"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Description
                                        </label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            placeholder="Describe your project requirements..."
                                            rows={4}
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="resize-none border-1 border-gray-200"
                                        />
                                    </div>
                                </div>
                                <AttachmentsSection
                                    attachments={attachments}
                                    uploadingFiles={uploadingFiles}
                                    editingFile={editingFile}
                                    editingFileName={editingFileName}
                                    onFileUpload={handleFileUpload}
                                    onRemoveAttachment={removeAttachment}
                                    onStartEditing={startEditingFile}
                                    onSaveEditing={saveEditingFileName}
                                    onCancelEditing={cancelEditingFileName}
                                    onEditingFileNameChange={setEditingFileName}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <section className="p-0 md:p-6">
                        <h1 className="text-3xl font-semibold text-[rgb(0,0,122)] text-center">
                            Managed By:
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <button
                                type="button"
                                onClick={() => setSelectedPlan("jagedo")}
                                className={`cursor-pointer p-6 rounded-2xl shadow-lg transition hover:scale-105 ${selectedPlan?.toLowerCase() == "jagedo"
                                    ? "bg-[rgb(0,0,122)] text-white"
                                    : "bg-blue-200 text-gray-800"
                                    }`}
                            >
                                <h2 className="text-4xl font-bold mb-4">
                                    JaGedo
                                </h2>
                                <p className="text-lg text-left font-bold">
                                    JaGedo Oversees
                                </p>
                                <ul className="space-y-3 mt-4">
                                    <li className="flex items-center">
                                        <TiTick className="text-green-300 mr-2 text-xl" />
                                        Time: Duration of Execution
                                    </li>
                                    <li className="flex items-center">
                                        <TiTick className="text-green-300 mr-2 text-xl" />
                                        Scope of budget: Determined through Competitive bidding
                                    </li>
                                    <li className="flex items-center">
                                        <TiTick className="text-green-300 mr-2 text-xl" />
                                        Quality: Professionalism and peer reviewing
                                    </li>
                                </ul>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedPlan("self")}
                                className={`cursor-pointer p-6 rounded-2xl shadow-lg transition hover:scale-105 ${selectedPlan?.toLowerCase() == "self"
                                    ? "bg-[rgb(0,0,122)] text-white"
                                    : "bg-blue-200 text-gray-800"
                                    }`}
                            >
                                <h2 className="text-4xl font-bold mb-4">
                                    Self
                                </h2>
                                <p className="text-lg text-left font-bold">
                                    JaGedo Oversees
                                </p>
                                <ul className="space-y-3 mt-4">
                                    <li className="flex items-center">
                                        <TiTick className="text-green-500 mr-2 text-xl" />
                                        Scope budget: Determined through Competitive bidding.
                                    </li>
                                    <p className="text-lg text-left font-bold">
                                        Client manages
                                    </p>
                                    <li className="flex items-center">
                                        <TiTick className="text-green-500 mr-2 text-xl" />
                                        Time: Duration of Execution.
                                    </li>
                                    <li className="flex items-center">
                                        <TiTick className="text-green-500 mr-2 text-xl" />
                                        Quality: Professionalism and peer review.
                                    </li>
                                </ul>
                            </button>
                        </div>
                    </section>
                    <div className="bg-blue-200 text-gray-800 p-6 rounded-2xl shadow-lg hover:scale-105 transition">
                        <h3 className="text-xl font-bold pb-2">
                            Professional Service Policy
                        </h3>
                        <p className="pb-4">
                            For professional jobs JaGedo recommends professionals registered with professional bodies i.e BORAQS, EBK, GRB e.t.c through the platform.
                        </p>
                        <h3 className="font-bold text-xl mb-4">
                            Terms & Conditions
                        </h3>
                        <ul className="space-y-3 mt-4 list-disc list-inside">
                            <li>Fee covers Professional travel, printing and communication charges.</li>
                            <li>Response time within 8 days of request placement.</li>
                            <li>Working hours: 8.00 a.m – 6.00 p.m</li>
                            <li>Payments are processed through Jagedos Escrow system.</li>
                            <li>Downward scope variations: not allowed.</li>
                            <li>Upward scope variations: treated as a different job.</li>
                        </ul>

                    </div>
                    <div className="flex justify-center items-center space-x-2 pt-2">
                        <Checkbox
                            id="acceptPolicyProfessional"
                            checked={acceptedPolicy}
                            onCheckedChange={(checked) =>
                                setAcceptedPolicy(checked as boolean)
                            }
                        />
                        <label
                            htmlFor="acceptPolicyProfessional"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            <span
                                className="cursor-pointer text-blue-600 hover:underline"
                                onClick={() => window.open("https://jagedo.s3.us-east-1.amazonaws.com/legal/JaGedo%20Professional%20Agreement.pdf", "_blank")}
                            >
                                I agree to the Professional's Agreement
                            </span>
                        </label>
                    </div>
                    <div className="pt-4 animate-fade-in-up animation-delay-400 flex items-center">
                        <Button
                            type="submit"
                            className="w-fit bg-[#00007a] hover:bg-[#00007a]/90 text-white py-6 text-lg px-6 mx-auto mb-4"
                            disabled={!isFormValid() || isSubmitting}
                        >
                            {isSubmitting
                                ? "Submitting Request..."
                                : "Request For Quotation"}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
