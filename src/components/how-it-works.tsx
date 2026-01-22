import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowRight,
    UserPlus,
    Send,
    CreditCard,
    Activity,
    Star,
    UserCheck,
    MessageSquare,
    Award,
    BarChart3,
    DollarSign,
    Users,
    CheckCircle,
    Shield,
    Clock,
    Briefcase,
    TrendingUp,
    GraduationCap,
    GroupIcon as Team
} from "lucide-react";

export default function HowItWorks() {
    const [activeTab, setActiveTab] = useState("customers");

    const customerSteps = [
        {
            number: 1,
            title: "Sign Up",
            description:
                "Create your account and verify your details with our secure onboarding process",
            icon: <UserPlus className="h-7 w-7" />
        },
        {
            number: 2,
            title: "Request",
            description:
                "Submit detailed project requirements and get matched with qualified professionals",
            icon: <Send className="h-7 w-7" />
        },
        {
            number: 3,
            title: "Pay to Escrow",
            description:
                "Securely deposit funds with milestone-based releases for your protection",
            icon: <CreditCard className="h-7 w-7" />
        },
        {
            number: 4,
            title: "Track Execution",
            description:
                "Monitor real-time progress with advanced project management tools",
            icon: <Activity className="h-7 w-7" />
        },
        {
            number: 5,
            title: "Complete & Review",
            description:
                "Approve deliverables and share feedback to help our community grow",
            icon: <Star className="h-7 w-7" />
        }
    ];

    const builderSteps = [
        {
            number: 1,
            title: "Sign up & Set Profile",
            description:
                "Build a comprehensive professional profile showcasing your expertise and portfolio",
            icon: <UserCheck className="h-7 w-7" />
        },
        {
            number: 2,
            title: "Receive Requests",
            description:
                "Get intelligent notifications for projects matching your skills and location",
            icon: <MessageSquare className="h-7 w-7" />
        },
        {
            number: 3,
            title: "Bid and Win",
            description:
                "Submit competitive, detailed proposals to secure high-value projects",
            icon: <Award className="h-7 w-7" />
        },
        {
            number: 4,
            title: "Job Execution Updates",
            description:
                "Provide transparent progress updates through our integrated platform",
            icon: <BarChart3 className="h-7 w-7" />
        },
        {
            number: 5,
            title: "Get Paid & Reviewed",
            description:
                "Receive guaranteed payments and build your professional reputation",
            icon: <DollarSign className="h-7 w-7" />
        }
    ];

    const customerBenefits = [
        {
            title: "Verified Professionals",
            description:
                "Access to thoroughly vetted, certified construction experts with proven track records.",
            icon: <Users className="h-6 w-6" />,
            gradient: "from-blue-600 to-blue-700",
            bgGradient: "from-blue-50 to-blue-100"
        },
        {
            title: "Comprehensive Platform",
            description:
                "Over 1500+ construction services available in one integrated marketplace.",
            icon: <CheckCircle className="h-6 w-6" />,
            gradient: "from-emerald-600 to-emerald-700",
            bgGradient: "from-emerald-50 to-emerald-100"
        },
        {
            title: "Secure Escrow System",
            description:
                "Military-grade security with milestone-based payments for complete peace of mind.",
            icon: <Shield className="h-6 w-6" />,
            gradient: "from-indigo-600 to-indigo-700",
            bgGradient: "from-indigo-50 to-indigo-100"
        },
        {
            title: "Quality Assurance",
            description:
                "Every project undergoes rigorous peer review and quality control processes.",
            icon: <CheckCircle className="h-6 w-6" />,
            gradient: "from-teal-600 to-teal-700",
            bgGradient: "from-teal-50 to-teal-100"
        },
        {
            title: "Advanced Project Tools",
            description:
                "Real-time tracking, collaboration tools, and detailed progress analytics.",
            icon: <BarChart3 className="h-6 w-6" />,
            gradient: "from-purple-600 to-purple-700",
            bgGradient: "from-purple-50 to-purple-100"
        },
        {
            title: "Time Optimization",
            description:
                "AI-powered matching system connects you with the right professional instantly.",
            icon: <Clock className="h-6 w-6" />,
            gradient: "from-orange-600 to-orange-700",
            bgGradient: "from-orange-50 to-orange-100"
        }
    ];

    const builderBenefits = [
        {
            title: "Abundant Opportunities",
            description:
                "Direct access to high-value construction projects from verified clients.",
            icon: <Briefcase className="h-6 w-6" />,
            gradient: "from-blue-600 to-blue-700",
            bgGradient: "from-blue-50 to-blue-100"
        },
        {
            title: "Guaranteed Fair Pay",
            description:
                "Transparent pricing with timely, milestone-based payment structures.",
            icon: <DollarSign className="h-6 w-6" />,
            gradient: "from-emerald-600 to-emerald-700",
            bgGradient: "from-emerald-50 to-emerald-100"
        },
        {
            title: "Professional Development",
            description:
                "Comprehensive apprenticeship programs and advanced skill development courses.",
            icon: <GraduationCap className="h-6 w-6" />,
            gradient: "from-indigo-600 to-indigo-700",
            bgGradient: "from-indigo-50 to-indigo-100"
        },
        {
            title: "Team Collaboration",
            description:
                "Advanced communication tools for seamless teamwork and project coordination.",
            icon: <Team className="h-6 w-6" />,
            gradient: "from-teal-600 to-teal-700",
            bgGradient: "from-teal-50 to-teal-100"
        },
        {
            title: "Payment Security",
            description:
                "Bank-level security with guaranteed milestone payments and fraud protection.",
            icon: <Shield className="h-6 w-6" />,
            gradient: "from-purple-600 to-purple-700",
            bgGradient: "from-purple-50 to-purple-100"
        },
        {
            title: "Business Growth",
            description:
                "Build your reputation, expand your network, and scale your construction business.",
            icon: <TrendingUp className="h-6 w-6" />,
            gradient: "from-orange-600 to-orange-700",
            bgGradient: "from-orange-50 to-orange-100"
        }
    ];

    const currentBenefits =
        activeTab === "customers" ? customerBenefits : builderBenefits;
    const currentSteps =
        activeTab === "customers" ? customerSteps : builderSteps;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="container mx-auto px-4 py-16 space-y-20">
                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full text-sm font-medium text-slate-700 mb-4">
                        <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse"></span>
                        How JAGEDO Works
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent leading-tight">
                        Simple. Secure. Professional.
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Experience the future of construction marketplace with
                        our streamlined process designed for both customers and
                        builders
                    </p>
                </div>

                {/* Enhanced Tabs */}
                <Tabs
                    defaultValue="customers"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <div className="flex justify-center mb-16">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-emerald-200/30 rounded-2xl blur-xl"></div>
                            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20">
                                <TabsList className="grid w-full grid-cols-2 bg-transparent gap-3 h-auto p-2">
                                    <TabsTrigger
                                        value="customers"
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-xl hover:bg-slate-50/80 transition-all duration-500 rounded-xl px-8 py-4 font-semibold text-base relative overflow-hidden group"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            <div className="p-1 rounded-lg bg-white/20">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    />
                                                </svg>
                                            </div>
                                            For Customers
                                        </span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="builders"
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-xl hover:bg-slate-50/80 transition-all duration-500 rounded-xl px-8 py-4 font-semibold text-base relative overflow-hidden group"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            <div className="p-1 rounded-lg bg-white/20">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                                    />
                                                </svg>
                                            </div>
                                            For Builders
                                        </span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                    </div>

                    {/* Process Steps */}
                    <TabsContent value="customers" className="mt-0">
                        <div className="relative">
                            {/* Connection Line */}
                            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>

                            <div className="grid gap-8 md:gap-6 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
                                {currentSteps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="relative group"
                                        style={{
                                            animationDelay: `${index * 150}ms`
                                        }}
                                    >
                                        {/* Card */}
                                        <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group-hover:bg-white/90">
                                            {/* Step Number */}
                                            <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                                {step.number}
                                            </div>

                                            {/* Icon */}
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                                                {step.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="text-center space-y-3">
                                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                                                    {step.title}
                                                </h3>
                                                <p className="text-slate-600 leading-relaxed text-sm">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        {index < currentSteps.length - 1 && (
                                            <div className="hidden lg:block absolute top-20 -right-4 z-10">
                                                <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                                    <ArrowRight className="h-4 w-4 text-blue-500 animate-pulse" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="builders" className="mt-0">
                        <div className="relative">
                            {/* Connection Line */}
                            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>

                            <div className="grid gap-8 md:gap-6 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
                                {currentSteps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="relative group"
                                        style={{
                                            animationDelay: `${index * 150}ms`
                                        }}
                                    >
                                        {/* Card */}
                                        <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group-hover:bg-white/90">
                                            {/* Step Number */}
                                            <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                                {step.number}
                                            </div>

                                            {/* Icon */}
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                                                {step.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="text-center space-y-3">
                                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors duration-300">
                                                    {step.title}
                                                </h3>
                                                <p className="text-slate-600 leading-relaxed text-sm">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        {index < currentSteps.length - 1 && (
                                            <div className="hidden lg:block absolute top-20 -right-4 z-10">
                                                <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                                    <ArrowRight className="h-4 w-4 text-emerald-500 animate-pulse" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Enhanced Benefits Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-white/50 rounded-3xl"></div>
                    <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/30">
                        <div className="text-center space-y-6 mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full text-sm font-medium text-slate-700">
                                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse"></span>
                                Key Benefits
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Why Choose JAGEDO?
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                {activeTab === "customers"
                                    ? "Join thousands of satisfied customers who trust JAGEDO for their construction projects"
                                    : "Become part of our thriving community of professional builders and transform your business"}
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {currentBenefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="group relative"
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group-hover:bg-white/80 h-full">
                                        {/* Icon Container */}
                                        <div
                                            className={`relative h-16 w-16 rounded-2xl bg-gradient-to-br ${benefit.bgGradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                                        >
                                            <div
                                                className={`text-transparent bg-clip-text bg-gradient-to-r ${benefit.gradient}`}
                                            >
                                                {benefit.icon}
                                            </div>
                                            <div
                                                className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}
                                            ></div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-300">
                                                {benefit.title}
                                            </h3>
                                            <p className="text-slate-600 leading-relaxed">
                                                {benefit.description}
                                            </p>
                                        </div>

                                        {/* Hover Effect */}
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="text-center space-y-8">
                    <h3 className="text-3xl font-bold text-slate-800">
                        Ready to Get Started?
                    </h3>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Join JAGEDO today and experience the future of
                        construction marketplace
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById("signup");
                                if (el)
                                    el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
    );
}
