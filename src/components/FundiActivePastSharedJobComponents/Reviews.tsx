/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';
import { useGlobalContext } from '@/context/GlobalProvider';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import { createReview, getReviews } from "@/api/reviews.api"
import { getJobRequestById } from "@/api/jobRequests.api"
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";


interface Review {
    id: number;
    jobRequestId: number;
    reviewer: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    reviewee: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    reviewType: 'CUSTOMER_TO_PROVIDER' | 'PROVIDER_TO_CUSTOMER';
    clarityOfRequirements: number;
    timelinessOfPayment: number;
    communication: number;
    professionalismAndRespect: number;
    flexibilityAndCooperation: number;
    rating?: number;
    customerComments: string | null;
    providerComments: string | null;
    createdAt: string;
}

interface ReviewFormData {
    clarityOfRequirements: number;
    timelinessOfPayment: number;
    communication: number;
    professionalismAndRespect: number;
    flexibilityAndCooperation: number;
    rating: number;
    customerComments: string;
    providerComments: string;
}

interface JobSpecification {
    id: number;
    customer: {
        id: number;
        firstName: string;
        lastName: string;
    };
    assignedServiceProvider: {
        id: number;
        firstName: string;
        lastName: string;
    };
}

const Reviews: React.FC = () => {
    const axiosInstance = useAxiosWithAuth()
    const { id } = useParams<{ id: string }>();
    const { user } = useGlobalContext();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [job, setJob] = useState<JobSpecification | null>(null);
    const [formData, setFormData] = useState<ReviewFormData>({
        clarityOfRequirements: 5,
        timelinessOfPayment: 5,
        communication: 5,
        professionalismAndRespect: 5,
        flexibilityAndCooperation: 5,
        rating: 5,
        customerComments: '',
        providerComments: ''
    });

    // Check if current user has already submitted a review
    const hasUserReviewed = reviews?.some((review) => review.reviewer.id === user?.id);

    // Determine review type based on user type
    const getReviewType = () => {
        return user?.user_type?.toLowerCase() === 'customer' ? 'CUSTOMER_TO_PROVIDER' : 'PROVIDER_TO_CUSTOMER';
    };

    // Fetch reviews for the job
    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await getReviews(axiosInstance, id);
            setReviews(response.hashSet);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobRequest = async () => {
        if (!id) {
            toast.error("Job ID not found in URL.");
            setLoading(false);
            return;
        }
        try {
            const response = await getJobRequestById(axiosInstance, id);
            if (response.success) {
                setJob(response.data);
            } else {
                console.error(
                    "Failed to fetch job request:",
                    response.message
                );
                toast.error(
                    response.message || "Could not load job details."
                );
            }
        } catch (error) {
            console.error("Error fetching job request:", error);
            toast.error("An error occurred while fetching job details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchReviews();
            fetchJobRequest();
        }
    }, [id]);

    // Handle star rating click
    const handleStarClick = (field: keyof ReviewFormData, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle form submission
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id) return;

        try {
            setSubmitting(true);
            const reviewData = {
                jobRequestId: parseInt(id),
                reviewerId: user.id,
                revieweeId: user.user_type?.toLowerCase() === 'customer' ? job?.assignedServiceProvider?.id : job?.customer?.id,
                reviewType: getReviewType(),
                ...formData
            };

            const response = await createReview(axiosInstance, reviewData);

            if (response.success) {
                setShowReviewForm(false);
                fetchReviews(); // Refresh reviews
                toast.success('Review submitted successfully!');
                // Reset form
                setFormData({
                    clarityOfRequirements: 5,
                    timelinessOfPayment: 5,
                    communication: 5,
                    professionalismAndRespect: 5,
                    flexibilityAndCooperation: 5,
                    rating: 5,
                    customerComments: '',
                    providerComments: ''
                });
            } else {
                toast.error(response.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('An error occurred while submitting your review');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate overall rating from individual ratings
    const calculateOverallRating = (review: Review) => {
        const ratings = [
            review.clarityOfRequirements,
            review.timelinessOfPayment,
            review.communication,
            review.professionalismAndRespect,
            review.flexibilityAndCooperation
        ];
        return Math.round(ratings?.reduce((sum, rating) => sum + rating, 0) / ratings?.length);
    };

    // Render star rating
    const renderStars = (rating: number, onStarClick?: (value: number) => void, readonly = false) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            } ${!readonly && onStarClick ? 'cursor-pointer hover:text-yellow-400' : ''}`}
                        onClick={() => !readonly && onStarClick && onStarClick(star)}
                    />
                ))}
            </div>
        );
    };

    // Render review form
    const renderReviewForm = () => (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Leave a Review
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Rating Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clarity of Requirements
                        </label>
                        {renderStars(formData.clarityOfRequirements, (value) =>
                            handleStarClick('clarityOfRequirements', value)
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timeliness of Payment
                        </label>
                        {renderStars(formData.timelinessOfPayment, (value) =>
                            handleStarClick('timelinessOfPayment', value)
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Communication
                        </label>
                        {renderStars(formData.communication, (value) =>
                            handleStarClick('communication', value)
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Professionalism & Respect
                        </label>
                        {renderStars(formData.professionalismAndRespect, (value) =>
                            handleStarClick('professionalismAndRespect', value)
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Flexibility & Cooperation
                        </label>
                        {renderStars(formData.flexibilityAndCooperation, (value) =>
                            handleStarClick('flexibilityAndCooperation', value)
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Overall Rating
                        </label>
                        {renderStars(formData.rating, (value) =>
                            handleStarClick('rating', value)
                        )}
                    </div>
                </div>

                {/* Comments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments
                    </label>
                    <textarea
                        value={user?.user_type?.toLowerCase() === 'customer' ?
                            formData.customerComments : formData.providerComments}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [user?.user_type?.toLowerCase() === 'customer' ? 'customerComments' : 'providerComments']: e.target.value
                        }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Share your experience..."
                    />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </form>
        </div>
    );

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Loader className="animate-spin h-10 w-10 text-blue-600" />
        </div>
    }

    console.log("Reviews: ", reviews)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Reviews</h2>
                {!hasUserReviewed && user?.user_type?.toLowerCase() !== 'admin' && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Leave Review</span>
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showReviewForm && renderReviewForm()}

            {/* Reviews List */}
            {reviews?.length === 0 ? (
                <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reviews yet for this job.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews?.map((review) => (
                        <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                            {/* Review Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {review.reviewType === 'CUSTOMER_TO_PROVIDER' ? 'Customer' : 'Provider'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {renderStars(calculateOverallRating(review), undefined, true)}
                                    <span className="text-sm text-gray-500">
                                        {review.createdAt && (
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(review.createdAt).toLocaleDateString('en-GB')}</span>
                                            </div>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Rating Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Clarity:</span>
                                    {renderStars(review.clarityOfRequirements, undefined, true)}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment:</span>
                                    {renderStars(review.timelinessOfPayment, undefined, true)}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Communication:</span>
                                    {renderStars(review.communication, undefined, true)}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Professionalism:</span>
                                    {renderStars(review.professionalismAndRespect, undefined, true)}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Flexibility:</span>
                                    {renderStars(review.flexibilityAndCooperation, undefined, true)}
                                </div>
                            </div>

                            {/* Comments */}
                            {(review.customerComments || review.providerComments) && (
                                <div className="border-t pt-4">
                                    <p className="text-gray-700">
                                        {review.customerComments || review.providerComments}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reviews;
