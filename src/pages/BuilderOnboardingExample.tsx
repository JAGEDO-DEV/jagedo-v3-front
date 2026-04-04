import { useBuilderOnboarding } from '@/hooks/useBuilderOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Example page demonstrating multi-step builder skills onboarding
 * Shows how to use the useBuilderOnboarding hook
 */
const BuilderOnboardingExample = () => {
  const {
    currentStep,
    progressPercent,
    selectedBuilderType,
    setSelectedBuilderType,
    selectedSkills,
    builderTypes,
    availableSkills,
    getSpecializations,
    addSkill,
    removeSkill,
    updateSkillSpecializations,
    goToNextStep,
    goToPreviousStep,
    buildProfile,
    treeLoading,
    treeError,
    errors,
  } = useBuilderOnboarding({ autoLoad: true });

  const handleSubmit = () => {
    const profile = buildProfile();
    console.log('Builder Profile:', profile);
    // TODO: Submit to backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Builder Profile Setup</h1>
          <p className="text-gray-600">Tell us about your skills and specializations</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-gray-700">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Error Alert */}
        {treeError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <p className="text-red-800">{treeError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {treeLoading && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600">Loading skills tree...</p>
            </CardContent>
          </Card>
        )}

        {!treeLoading && !treeError && (
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && 'Step 1: Select Your Builder Type'}
                {currentStep === 2 && 'Step 2: Choose Your Skills'}
                {currentStep === 3 && 'Step 3: Select Specializations'}
                {currentStep === 4 && 'Step 4: Review Your Profile'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step 1: Builder Type Selection */}
              {currentStep === 1 && (
                <div>
                  <p className="text-gray-600 mb-4">What type of builder are you?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {builderTypes.map((type) => (
                      <button
                        key={type.code}
                        onClick={() => setSelectedBuilderType(type.code)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedBuilderType === type.code
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.skillCount} skills available</p>
                      </button>
                    ))}
                  </div>
                  {errors.builderType && (
                    <p className="mt-4 text-red-600 text-sm">{errors.builderType}</p>
                  )}
                </div>
              )}

              {/* Step 2: Skills Selection */}
              {currentStep === 2 && (
                <div>
                  <p className="text-gray-600 mb-4">Select your skills</p>
                  <div className="space-y-3">
                    {availableSkills.map((skill) => {
                      const isSelected = selectedSkills.some((s) => s.skillCode === skill.code);
                      return (
                        <button
                          key={skill.code}
                          onClick={() => {
                            if (isSelected) {
                              removeSkill(skill.code);
                            } else {
                              addSkill(skill.code);
                            }
                          }}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                              <p className="text-sm text-gray-600">
                                {skill.specializations?.length || 0} specializations
                              </p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.skills && (
                    <p className="mt-4 text-red-600 text-sm">{errors.skills}</p>
                  )}
                </div>
              )}

              {/* Step 3: Specializations Selection */}
              {currentStep === 3 && (
                <div>
                  <p className="text-gray-600 mb-4">Select specializations for each skill</p>
                  <div className="space-y-6">
                    {selectedSkills.map((skill) => {
                      const specializations = getSpecializations(skill.skillCode);
                      return (
                        <div key={skill.skillCode} className="border rounded-lg p-4 bg-gray-50">
                          <h3 className="font-semibold text-gray-900 mb-3">{skill.skillName}</h3>
                          <div className="space-y-2">
                            {specializations.map((spec) => {
                              const isSelected = skill.specializations.includes(spec.code);
                              return (
                                <label
                                  key={spec.code}
                                  className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newSpecs = e.target.checked
                                        ? [...skill.specializations, spec.code]
                                        : skill.specializations.filter((c) => c !== spec.code);
                                      updateSkillSpecializations(skill.skillCode, newSpecs);
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded"
                                  />
                                  <span className="ml-3 text-gray-700">{spec.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.specializations && (
                    <p className="mt-4 text-red-600 text-sm">{errors.specializations}</p>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div>
                  <p className="text-gray-600 mb-4">Review your profile before submitting</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Builder Type</p>
                      <p className="text-gray-900">
                        {builderTypes.find((t) => t.code === selectedBuilderType)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Skills & Specializations</p>
                      <ul className="mt-2 space-y-2">
                        {selectedSkills.map((skill) => (
                          <li key={skill.skillCode} className="text-gray-900">
                            <p className="font-medium">{skill.skillName}</p>
                            <p className="text-sm text-gray-600">
                              {skill.specializations.length > 0
                                ? skill.specializations.join(', ')
                                : 'No specializations selected'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={goToNextStep} className="bg-blue-600 hover:bg-blue-700">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    Submit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BuilderOnboardingExample;
