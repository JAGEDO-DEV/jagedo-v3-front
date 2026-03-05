import { getOrderReviewsById, postOrderReview } from "@/api/reviews.api";
import Loader from "@/components/Loader";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";
import { useParams } from 'react-router-dom';
import { useEffect, useState, FC, FormEvent, ChangeEvent } from "react";
import { toast } from "react-hot-toast";

const StarRating: FC<{
    rating: number;
    setRating?: (rating: number) => void;
    readOnly?: boolean;
}> = ({ rating, setRating, readOnly = false }) => {
    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`text-2xl cursor-${readOnly ? 'default' : 'pointer'}`}
                    onClick={() => !readOnly && setRating && setRating(star)}
                    style={{ color: star <= rating ? '#FFD700' : '#E4E5E9' }}
                >
                    &#9733;
                </span>
            ))}
        </div>
    );
};


interface Review {
    id: number;
    reviewer: {
        id: number;
        firstName: string;
        lastName: string;
    };
    reviewee: {
        id: number;
        firstName: string;
        lastName: string;
    };
    clarityOfRequirements: number;
    timelinessOfPayment: number;
    communication: number;
    professionalismAndRespect: number;
    flexibilityAndCooperation: number;
    customerComments: string;
    providerComments: string;
    createdAt: string;
}

const initialReviewState = {
    clarityOfRequirements: 0,
    timelinessOfPayment: 0,
    communication: 0,
    professionalismAndRespect: 0,
    flexibilityAndCooperation: 0,
    comments: "",
};

const OrderReviews = () => {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { user } = useGlobalContext();
    const userType = user?.userType;
    const [reviews, setReviews] = useState<Review[]>([]);
    const [revieweeId, setRevieweeId] = useState(user.id);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [newReview, setNewReview] = useState(initialReviewState);
    const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
    const { id: orderId } = useParams<{ id: string }>();

    useEffect(() => {
        const fetchReviews = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const response = await getOrderReviewsById(axiosInstance, orderId);
                
                if (response && response.data) {
                    setReviews(response.data);

                    if (response.data.length > 0 && user) {
                        const firstReview = response.data[0];
                        const inferredReviewee = firstReview.reviewer.id === user.id 
                            ? firstReview.reviewee.id 
                            : firstReview.reviewer.id;
                        setRevieweeId(inferredReviewee);
                    }
                } else {
                    setReviews([]);
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to load reviews");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [orderId, user, refreshFlag]);

    const handleRatingChange = (field: keyof typeof initialReviewState, value: number) => {
        setNewReview(prev => ({ ...prev, [field]: value }));
    };

    const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNewReview(prev => ({ ...prev, comments: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        const currentUserId = user?.id;

        if (!orderId || !currentUserId || !revieweeId) {
            toast.error("Cannot submit review. Key information like Reviewee ID is missing. A prior review may be needed.");
            return;
        }

        if (!newReview.comments) {
            toast.error("Please leave a comment.");
            return;
        }

        setSubmitting(true);

        const reviewType = userType === 'CUSTOMER' ? 'CUSTOMER_TO_PROVIDER' : 'PROVIDER_TO_CUSTOMER';
        const payload = {
            orderId: parseInt(orderId, 10),
            reviewerId: currentUserId,
            revieweeId,
            reviewType,
            ...newReview,
            customerComments: userType === 'CUSTOMER' ? newReview.comments : "",
            providerComments: userType === 'PROVIDER' ? newReview.comments : "",
        };
        delete (payload as any).comments;

        try {
            await postOrderReview(axiosInstance,orderId, payload);
            toast.success("Review submitted successfully!");
            setNewReview(initialReviewState);
            setRefreshFlag(prev => !prev);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit review.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <Loader />;
    }
    
    if (!orderId) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-2xl font-bold mb-4 text-red-500">Order Information Not Available</h1>
                <p>This component requires an Order ID to fetch and submit reviews.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Order Reviews</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Past Reviews</h2>
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-4 border rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold">{review.reviewer.firstName} {review.reviewer.lastName}</h3>
                                    <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="space-y-2">
                                    <p>Communication: <StarRating rating={review.communication} readOnly /></p>
                                    <p>Professionalism: <StarRating rating={review.professionalismAndRespect} readOnly /></p>
                                    <p>Clarity of Requirements: <StarRating rating={review.clarityOfRequirements} readOnly /></p>
                                    <p>Timeliness of Payment: <StarRating rating={review.timelinessOfPayment} readOnly /></p>
                                    <p>Flexibility: <StarRating rating={review.flexibilityAndCooperation} readOnly /></p>
                                </div>
                                <p className="mt-4 bg-gray-100 p-2 rounded">
                                    {review.customerComments || review.providerComments}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No reviews for this order yet.</p>
                )}
            </div>

            <div className="p-4 border rounded-lg shadow-sm">
                 <h2 className="text-xl font-semibold mb-4">Leave a Review</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                         <label className="block font-medium mb-1">Clarity of Requirements</label>
                         <StarRating rating={newReview.clarityOfRequirements} setRating={(value) => handleRatingChange('clarityOfRequirements', value)} />
                     </div>
                     <div>
                         <label className="block font-medium mb-1">Timeliness of Payment</label>
                         <StarRating rating={newReview.timelinessOfPayment} setRating={(value) => handleRatingChange('timelinessOfPayment', value)} />
                     </div>
                     <div>
                         <label className="block font-medium mb-1">Communication</label>
                         <StarRating rating={newReview.communication} setRating={(value) => handleRatingChange('communication', value)} />
                     </div>
                     <div>
                         <label className="block font-medium mb-1">Professionalism and Respect</label>
                         <StarRating rating={newReview.professionalismAndRespect} setRating={(value) => handleRatingChange('professionalismAndRespect', value)} />
                     </div>
                     <div>
                         <label className="block font-medium mb-1">Flexibility and Cooperation</label>
                         <StarRating rating={newReview.flexibilityAndCooperation} setRating={(value) => handleRatingChange('flexibilityAndCooperation', value)} />
                     </div>
                     
                     <div>
                         <label htmlFor="comments" className="block font-medium mb-1">Comments</label>
                         <textarea
                            id="comments"
                            value={newReview.comments}
                            onChange={handleCommentChange}
                            className="w-full p-2 border rounded"
                            rows={4}
                            placeholder="Share your experience..."
                            required
                         />
                     </div>
                     <button type="submit" disabled={submitting || !revieweeId} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
                         {submitting ? "Submitting..." : "Submit Review"}
                     </button>
                 </form>
            </div>
        </div>
    );
};

export default OrderReviews;