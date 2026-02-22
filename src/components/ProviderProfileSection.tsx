// import React, { useState } from "react";
// import { fileToBase64, saveImage } from "../utils/fileUpload";
// import { Check, AlertCircle, Loader2 } from "lucide-react";
// import { updateProviderProfile } from "@/api/provider.api";
// import { toast, Toaster } from "sonner";
// import useAxiosWithAuth from "@/utils/axiosInterceptor";

// interface ProviderProfileSectionProps {
//     userType: string;
//     user: Partial<FundiProfile | ProfessionalContractorProfile | HardwareProfile>;
// }

// type FundiProfile = {
//     skill: string;
//     levelOrClass: string;
//     yearsOfExperience: number;
//     idFrontUrl: string;
//     idBackUrl: string;
//     certificateUrl: string;
//     ncaRegCardUrl: string;
//     hasMajorWorks: string;
//     materialsUsed: string;
//     essentialEquipment: string;
//     quotationFormulation: string;
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//     email: string;
//     gender: string;
//     county: string;
//     state: string;
//     userId: string;
//     id: any;
//     previousJobPhotoUrls: string[];
// };

// type ProfessionalContractorProfile = {
//     profession: string;
//     levelOrClass: string;
//     yearsOfExperience: number;
//     idFrontUrl: string;
//     idBackUrl: string;
//     cvUrl: string;
//     academicCertificateUrl: string;
//     registrationCertificateUrl: string;
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//     email: string;
//     county: string;
//     state: string;
//     contractorType: string;
//     accountType: string;
// };

// type HardwareProfile = {
//     certificateOfIncorporation: string;
//     kraPIN: string;
//     singleBusinessPermit: string;
//     county: string;
//     state: string;
//     hardwareTypes: string;
//     contactfirstName: string;
//     contactlastName: string;
//     contactPhone: string;
//     contactEmail: string;
// };

// type FieldDefinition = {
//     key: string;
//     label: string;
//     type: string;
// };

// const fundiFields: FieldDefinition[] = [
//     { key: "skill", label: "Skill", type: "text" },
//     { key: "levelOrClass", label: "Level/Class", type: "text" },
//     { key: "yearsOfExperience", label: "Years of Experience", type: "number" },
//     { key: "idFrontUrl", label: "ID Front Image", type: "file" },
//     { key: "idBackUrl", label: "ID Back Image", type: "file" },
//     { key: "certificateUrl", label: "Certificate Image", type: "file" },
//     { key: "ncaRegCardUrl", label: "NCA Reg Card Image", type: "file" },
//     { key: "hasMajorWorks", label: "Has Major Works?", type: "text" },
//     { key: "materialsUsed", label: "Materials Used", type: "text" },
//     { key: "essentialEquipment", label: "Essential Equipment", type: "text" },
//     { key: "quotationFormulation", label: "Quotation Formulation", type: "text" },
//     { key: "firstName", label: "First Name", type: "text" },
//     { key: "lastName", label: "Last Name", type: "text" },
//     { key: "phoneNumber", label: "Phone Number", type: "text" },
//     { key: "email", label: "Email", type: "email" },
//     { key: "gender", label: "Gender", type: "text" },
//     { key: "county", label: "County", type: "text" },
//     { key: "state", label: "State", type: "text" },
//     { key: "previousJobPhotoUrls", label: "Previous Job Photos", type: "multi-file" },
// ];

// const professionalContractorFields: FieldDefinition[] = [
//     { key: "profession", label: "Profession", type: "text" },
//     { key: "levelOrClass", label: "Level/Class", type: "text" },
//     { key: "yearsOfExperience", label: "Years of Experience", type: "number" },
//     { key: "idFrontUrl", label: "ID Front Image", type: "file" },
//     { key: "idBackUrl", label: "ID Back Image", type: "file" },
//     { key: "cvUrl", label: "CV File", type: "file" },
//     { key: "academicCertificateUrl", label: "Academic Certificate", type: "file" },
//     { key: "registrationCertificateUrl", label: "Registration Certificate", type: "file" },
//     { key: "firstName", label: "First Name", type: "text" },
//     { key: "lastName", label: "Last Name", type: "text" },
//     { key: "phoneNumber", label: "Phone Number", type: "text" },
//     { key: "email", label: "Email", type: "email" },
//     { key: "county", label: "County", type: "text" },
//     { key: "state", label: "State", type: "text" },
//     { key: "contractorType", label: "Contractor Type", type: "text" },
//     { key: "accountType", label: "Account Type", type: "text" },
// ];

// const hardwareFields: FieldDefinition[] = [
//     { key: "certificateOfIncorporation", label: "Certificate of Incorporation", type: "file" },
//     { key: "kraPIN", label: "KRA PIN", type: "text" },
//     { key: "singleBusinessPermit", label: "Single Business Permit", type: "file" },
//     { key: "county", label: "County", type: "text" },
//     { key: "state", label: "State", type: "text" },
//     { key: "hardwareTypes", label: "Hardware Types", type: "text" },
//     { key: "contactfirstName", label: "Contact First Name", type: "text" },
//     { key: "contactlastName", label: "Contact Last Name", type: "text" },
//     { key: "contactPhone", label: "Contact Phone", type: "text" },
//     { key: "contactEmail", label: "Contact Email", type: "email" },
// ];

// function getFields(userType: string): FieldDefinition[] {
//     if (!userType) return [];
//     const type = userType.toLowerCase();
//     if (type === "fundi") return fundiFields;
//     if (type === "professional" || type === "contractor") return professionalContractorFields;
//     if (type === "hardware") return hardwareFields;
//     return [];
// }



// function getInitialState(userType: string, user: Partial<FundiProfile | ProfessionalContractorProfile | HardwareProfile>) {
//     const fields = getFields(userType);
//     const state: Record<string, any> = {};

//     fields.forEach(({ key, type }) => {
//         if (type === "multi-file") {
//             state[key] = Array.isArray(user?.[key]) ? [...user[key]] : [];
//         } else {
//             state[key] = user?.[key] || "";
//         }
//     });

//     return state;
// }

// const ProviderProfileSection: React.FC<ProviderProfileSectionProps> = ({ userType, user }) => {
//     const axiosInstance = useAxiosWithAuth(import.meta.env.VITER_SERVER_URL)
//     const [form, setForm] = useState(() => getInitialState(userType, user));
//     const [loading, setLoading] = useState<Record<string, boolean>>({});
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const [message, setMessage] = useState<{ text: string; isError: boolean }>({ text: "", isError: false });
//     // Attachments state for file/image fields (by key)
//     const [attachments, setAttachments] = useState<Record<string, { url: string; name: string } | null>>({ idFrontUrl: form.idFrontUrl ? { url: form.idFrontUrl, name: "Uploaded" } : null });

//     const fields = getFields(userType);


//     console.log("Form: ", form)

//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value, type } = e.target;
//         setForm(prev => ({
//             ...prev,
//             [name]: type === "number" ? Number(value) : value
//         }));
//         // Clear error when user types
//         if (errors[name]) {
//             setErrors(prev => ({ ...prev, [name]: "" }));
//         }
//     };

//     // Refactored file upload handler for idFrontUrl (template for others)
//     // Multi-upload handler for previousJobPhotoUrls
//     const handleMultiFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
//         const files = e.target.files;
//         if (!files || files.length === 0) return;
//         setLoading(prev => ({ ...prev, [key]: true }));
//         setErrors(prev => ({ ...prev, [key]: "" }));
//         try {
//             const uploadedUrls: string[] = [];
//             for (let i = 0; i < files.length; i++) {
//                 const base64 = await fileToBase64(files[i]);
//                 const url = await saveImage(base64);
//                 if (url) {
//                     uploadedUrls.push(url);
//                 } else {
//                     throw new Error("Upload failed");
//                 }
//             }
//             setForm(prev => ({
//                 ...prev,
//                 [key]: [...(prev[key] || []), ...uploadedUrls]
//             }));
//         } catch (err: any) {
//             setErrors(prev => ({ ...prev, [key]: err.message || "Upload failed. Please try again." }));
//         } finally {
//             setLoading(prev => ({ ...prev, [key]: false }));
//         }
//     };

//     const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
//         if (key === "previousJobPhotoUrls") {
//             return handleMultiFileChange(e, key);
//         }
//         const files = e.target.files;
//         if (!files || files.length === 0) return;
//         setLoading(prev => ({ ...prev, [key]: true }));
//         setErrors(prev => ({ ...prev, [key]: "" }));
//         try {
//             const file = files[0];
//             const base64 = await fileToBase64(file);
//             const url = await saveImage(base64);
//             if (url) {
//                 setAttachments(prev => ({ ...prev, [key]: { url, name: file.name } }));
//                 setForm(prev => ({ ...prev, [key]: url }));
//             } else {
//                 throw new Error("Upload failed");
//             }
//         } catch (err: any) {
//             setErrors(prev => ({ ...prev, [key]: err.message || "Upload failed. Please try again." }));
//         } finally {
//             setLoading(prev => ({ ...prev, [key]: false }));
//         }
//     };

//     // Remove for previousJobPhotoUrls
//     const removeMultiFile = (key: string, index: number) => {
//         setForm(prev => ({
//             ...prev,
//             [key]: prev[key].filter((_: any, i: number) => i !== index)
//         }));
//     };

//     // Remove uploaded file for a given key
//     const removeAttachment = (key: string) => {
//         setAttachments(prev => ({ ...prev, [key]: null }));
//         setForm(prev => ({ ...prev, [key]: "" }));
//     };

//     const removeFile = (key: string, index?: number) => {
//         if (typeof index === 'number') {
//             // Remove specific file from array (multi-file)
//             setForm(prev => ({
//                 ...prev,
//                 [key]: prev[key].filter((_: any, i: number) => i !== index)
//             }));
//         } else {
//             // Remove single file
//             setForm(prev => ({ ...prev, [key]: "" }));
//         }
//     };

//     const validateForm = (): boolean => {
//         const newErrors: Record<string, string> = {};
//         let isValid = true;

//         fields.forEach(({ key, label, type }) => {
//             if (
//                 (type === "multi-file" && (!form[key] || form[key].length === 0)) ||
//                 (type !== "multi-file" && !form[key])
//             ) {
//                 newErrors[key] = `${label} is required`;
//                 isValid = false;
//             } else if (type === "email" && form[key] && !/^\S+@\S+\.\S+$/.test(form[key])) {
//                 newErrors[key] = "Please enter a valid email";
//                 isValid = false;
//             }
//         });

//         setErrors(newErrors);
//         return isValid;
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!validateForm()) {
//             setMessage({ text: "Please fill all required fields correctly.", isError: true });
//             setTimeout(() => setMessage({ text: "", isError: false }), 3000);
//             return;
//         }

//         try {
//             setIsSubmitting(true)
//             const data = userType.toLowerCase() == "fundi" ? {
//                 ...form,
//                 //@ts-ignore
//                 userId: user?.id
//             } : { ...form };
//             const response = await updateProviderProfile(axiosInstance, data, userType);
//             if (response.success) { toast.success("Provider profile saved successfully!"); } else {
//                 toast.error("Error Updating Provider Profile. Please try again.")
//             }
//         } catch (error) {
//             toast.error("Failed to save profile. Please try again.");
//         } finally {
//             setIsSubmitting(false)
//         }
//     };

//     const renderFilePreview = (url: string) => {
//         if (!url) return null;

//         if (url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i)) {
//             return (
//                 <img
//                     src={url}
//                     alt="preview"
//                     className="h-16 w-16 object-cover rounded border mt-2 cursor-pointer"
//                     onClick={() => window.open(url, "_blank")}
//                     onError={e => {
//                         (e.target as HTMLImageElement).src = "https://via.placeholder.com/64x64?text=Broken";
//                     }}
//                 />
//             );
//         }

//         if (url.match(/\.pdf$/i)) {
//             return (
//                 <div className="flex items-center mt-2">
//                     <span className="text-blue-700 underline">View PDF</span>
//                 </div>
//             );
//         }

//         return (
//             <div className="flex items-center mt-2">
//                 <span className="text-blue-700 underline">View File</span>
//             </div>
//         );
//     };

//     return (
//         <form className="space-y-6" onSubmit={handleSubmit}>
//             <Toaster position="top-center" richColors />
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {fields.map(({ key, label, type }) => (
//                     <div key={key} className="mb-4">
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             {label}
//                             {errors[key] && (
//                                 <span className="text-red-500 ml-1">*</span>
//                             )}
//                         </label>

//                         {type === "text" || type === "email" || type === "number" ? (
//                             <div>
//                                 <input
//                                     type={type}
//                                     name={key}
//                                     value={form[key] || ""}
//                                     onChange={handleInputChange}
//                                     className={`w-full px-4 py-3 rounded-xl border ${errors[key] ? "border-red-500" : "border-slate-300"
//                                         } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
//                                 />
//                                 {errors[key] && (
//                                     <div className="mt-1 text-xs text-red-600 flex items-center">
//                                         <AlertCircle className="h-4 w-4 mr-1" />
//                                         {errors[key]}
//                                     </div>
//                                 )}
//                             </div>
//                         ) : type === "file" && key === "idFrontUrl" ? (
//                             <div>
//                                 {attachments.idFrontUrl ? (
//                                     <div className="flex items-center space-x-3 mb-2">
//                                         <div className="relative">
//                                             {renderFilePreview(attachments.idFrontUrl.url)}
//                                             <button
//                                                 type="button"
//                                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
//                                                 onClick={() => removeAttachment("idFrontUrl")}
//                                             >
//                                                 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                                 </svg>
//                                             </button>
//                                         </div>
//                                         <button
//                                             type="button"
//                                             className="text-blue-600 underline text-xs"
//                                             onClick={() => document.getElementById(`file-input-idFrontUrl`)?.click()}
//                                         >
//                                             Change
//                                         </button>
//                                     </div>
//                                 ) : null}
//                                 {!attachments.idFrontUrl && (
//                                     <input
//                                         id={`file-input-idFrontUrl`}
//                                         type="file"
//                                         accept="image/*,application/pdf"
//                                         onChange={(e) => handleFileChange(e, "idFrontUrl")}
//                                         className={`w-full px-4 py-3 rounded-xl border ${errors[key] ? "border-red-500" : "border-slate-300"
//                                             } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
//                                     />
//                                 )}
//                                 {loading[key] && (
//                                     <div className="mt-2 flex items-center text-sm text-slate-500">
//                                         <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                                         Uploading...
//                                     </div>
//                                 )}
//                                 {errors[key] && (
//                                     <div className="mt-1 text-xs text-red-600 flex items-center">
//                                         <AlertCircle className="h-4 w-4 mr-1" />
//                                         {errors[key]}
//                                     </div>
//                                 )}
//                             </div>
//                         ) : type === "file" ? (
//                             <div>
//                                 {/* TODO: Refactor other file fields using attachments array logic */}
//                                 {form[key] ? (
//                                     <div className="flex items-center space-x-3 mb-2">
//                                         <div className="relative">
//                                             {renderFilePreview(form[key])}
//                                             <button
//                                                 type="button"
//                                                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
//                                                 onClick={() => removeFile(key)}
//                                             >
//                                                 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                                 </svg>
//                                             </button>
//                                         </div>
//                                         <button
//                                             type="button"
//                                             className="text-blue-600 underline text-xs"
//                                             onClick={() => document.getElementById(`file-input-${key}`)?.click()}
//                                         >
//                                             Change
//                                         </button>
//                                     </div>
//                                 ) : null}
//                                 <input
//                                     id={`file-input-${key}`}
//                                     type="file"
//                                     accept="image/*,application/pdf"
//                                     onChange={(e) => handleFileChange(e, key)}
//                                     className={`w-full px-4 py-3 rounded-xl border ${errors[key] ? "border-red-500" : "border-slate-300"
//                                         } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
//                                 />
//                                 {loading[key] && (
//                                     <div className="mt-2 flex items-center text-sm text-slate-500">
//                                         <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                                         Uploading...
//                                     </div>
//                                 )}
//                                 {errors[key] && (
//                                     <div className="mt-1 text-xs text-red-600 flex items-center">
//                                         <AlertCircle className="h-4 w-4 mr-1" />
//                                         {errors[key]}
//                                     </div>
//                                 )}
//                             </div>
//                         ) : type === "multi-file" && key === "previousJobPhotoUrls" ? (
//                             <div>
//                                 {Array.isArray(form[key]) && form[key].length > 0 && (
//                                     <div className="flex flex-wrap gap-2 mb-2">
//                                         {form[key].map((url: string, idx: number) => (
//                                             <div key={idx} className="relative group">
//                                                 {renderFilePreview(url)}
//                                                 <button
//                                                     type="button"
//                                                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-80 group-hover:opacity-100"
//                                                     onClick={() => removeMultiFile(key, idx)}
//                                                     tabIndex={-1}
//                                                 >
//                                                     <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                                     </svg>
//                                                 </button>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                                 <input
//                                     id={`file-input-${key}`}
//                                     type="file"
//                                     accept="image/*"
//                                     multiple
//                                     onChange={(e) => handleFileChange(e, key)}
//                                     className={`w-full px-4 py-3 rounded-xl border ${errors[key] ? "border-red-500" : "border-slate-300"
//                                         } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
//                                 />
//                                 {loading[key] && (
//                                     <div className="mt-2 flex items-center text-sm text-slate-500">
//                                         <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                                         Uploading...
//                                     </div>
//                                 )}
//                                 {errors[key] && (
//                                     <div className="mt-1 text-xs text-red-600 flex items-center">
//                                         <AlertCircle className="h-4 w-4 mr-1" />
//                                         {errors[key]}
//                                     </div>
//                                 )}
//                             </div>
//                         ) : null}
//                     </div>
//                 ))}
//             </div>

//             <div className="flex items-center justify-between pt-4">
//                 <button
//                     type="submit"
//                     className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
//                     disabled={Object.values(loading).some(Boolean) || isSubmitting}
//                 >
//                     {isSubmitting ? "Saving..." : "Save Provider Profile"}
//                 </button>
//             </div>

//             {message.text && (
//                 <div
//                     className={`flex items-center p-4 rounded-xl ${message.isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
//                         }`}
//                 >
//                     {message.isError ? (
//                         <AlertCircle className="h-5 w-5 mr-2" />
//                     ) : (
//                         <Check className="h-5 w-5 mr-2" />
//                     )}
//                     {message.text}
//                 </div>
//             )}
//         </form>
//     );
// };

// export default ProviderProfileSection;