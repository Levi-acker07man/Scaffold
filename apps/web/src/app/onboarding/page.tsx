"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [learnerType, setLearnerType] = useState<"typical" | "neurodivergent" | "">("");
  const [qualification, setQualification] = useState("");

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("You must be logged in to complete onboarding.");
      }

      const userId = session.user.id;

      // Save to profiles table
      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          age: parseInt(age, 10),
          country,
          city,
          learner_type: learnerType,
          qualification,
          updated_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      // Navigate to dashboard
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to save profile data.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={`h-2 flex-1 rounded-full transition-colors ${
            s <= step ? "bg-accent-base" : "bg-black/10"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-void p-4">
      <div className="clay p-8 md:p-12 w-full max-w-xl flex flex-col">
        {stepIndicator}
        
        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-[300px] flex flex-col justify-center">
          {step === 1 && (
            <div className="animation-fade-up">
              <h1 className="text-3xl font-extrabold text-text mb-2">How old are you?</h1>
              <p className="text-text-dim mb-8">This helps us tailor the learning experience.</p>
              <div className="field">
                <input
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={age ? "has-val" : ""}
                />
                <label>Age</label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animation-fade-up">
              <h1 className="text-3xl font-extrabold text-text mb-2">Where are you from?</h1>
              <p className="text-text-dim mb-8">Your country helps us connect you globally.</p>
              <div className="field">
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={country ? "has-val" : ""}
                />
                <label>Country</label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animation-fade-up">
              <h1 className="text-3xl font-extrabold text-text mb-2">Which city?</h1>
              <p className="text-text-dim mb-8">Almost there with location details.</p>
              <div className="field">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={city ? "has-val" : ""}
                />
                <label>City</label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animation-fade-up">
              <h1 className="text-3xl font-extrabold text-text mb-2">How do you learn best?</h1>
              <p className="text-text-dim mb-8">Select the profile that best describes your needs.</p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setLearnerType("typical")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    learnerType === "typical"
                      ? "border-accent-base bg-accent-bg"
                      : "border-clay-border bg-input-bg hover:bg-black/5"
                  }`}
                >
                  <h3 className="text-lg font-bold text-text">Typical Learner</h3>
                  <p className="text-sm text-text-dim mt-1">Standard interface and traditional pacing.</p>
                </button>
                <button
                  onClick={() => setLearnerType("neurodivergent")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    learnerType === "neurodivergent"
                      ? "border-accent-base bg-accent-bg"
                      : "border-clay-border bg-input-bg hover:bg-black/5"
                  }`}
                >
                  <h3 className="text-lg font-bold text-text">NeuroDivergent Learner</h3>
                  <p className="text-sm text-text-dim mt-1">Spacious UI, accessible fonts, and focused views.</p>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animation-fade-up">
              <h1 className="text-3xl font-extrabold text-text mb-2">What is your qualification?</h1>
              <p className="text-text-dim mb-8">E.g., High School, Undergraduate, Master's.</p>
              <div className="field">
                <input
                  type="text"
                  required
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className={qualification ? "has-val" : ""}
                />
                <label>Qualification</label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/5">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="px-6 py-3 font-bold text-text-dim hover:text-text disabled:opacity-30 transition-colors"
          >
            Back
          </button>
          
          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !age) ||
                (step === 2 && !country) ||
                (step === 3 && !city) ||
                (step === 4 && !learnerType)
              }
              className="cta-button max-w-[150px]"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!qualification || loading}
              className="cta-button max-w-[150px]"
            >
              {loading ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
