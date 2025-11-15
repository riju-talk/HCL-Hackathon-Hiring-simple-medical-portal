import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heart, Activity, Apple, Brain, Shield, Stethoscope } from "lucide-react";

const HealthInfo = () => {
  const topics = [
    {
      icon: Heart,
      title: "Cardiovascular Health",
      description: "Heart disease prevention and wellness",
      content: "Maintain a healthy heart through regular exercise, balanced diet, stress management, and regular checkups. Aim for 150 minutes of moderate aerobic activity weekly.",
    },
    {
      icon: Activity,
      title: "Physical Activity",
      description: "Exercise and movement guidelines",
      content: "Adults should get at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity activity per week, plus muscle-strengthening activities twice weekly.",
    },
    {
      icon: Apple,
      title: "Nutrition & Diet",
      description: "Healthy eating recommendations",
      content: "Focus on whole foods, fruits, vegetables, lean proteins, and whole grains. Limit processed foods, added sugars, and sodium. Stay hydrated with 8 glasses of water daily.",
    },
    {
      icon: Brain,
      title: "Mental Wellness",
      description: "Mental health and stress management",
      content: "Practice mindfulness, maintain social connections, get adequate sleep (7-9 hours), and don't hesitate to seek professional help when needed. Mental health is just as important as physical health.",
    },
    {
      icon: Shield,
      title: "Preventive Care",
      description: "Screenings and immunizations",
      content: "Stay up to date with vaccinations, annual checkups, and age-appropriate screenings. Early detection is key to better health outcomes.",
    },
    {
      icon: Stethoscope,
      title: "Chronic Disease Management",
      description: "Managing ongoing health conditions",
      content: "For chronic conditions, adherence to treatment plans, regular monitoring, lifestyle modifications, and open communication with healthcare providers are essential.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Health Information Hub</h1>
          <p className="text-muted-foreground">Evidence-based health guidelines and wellness information</p>
        </div>

        <div className="grid gap-6 mb-8">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>{topic.title}</CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{topic.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How often should I visit my doctor?</AccordionTrigger>
                <AccordionContent>
                  Most adults should have an annual checkup with their primary care physician. However, frequency may vary based on age, health status, and risk factors. Consult your healthcare provider for personalized recommendations.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What vaccinations do adults need?</AccordionTrigger>
                <AccordionContent>
                  Adults typically need annual flu shots, Td/Tdap boosters every 10 years, and may need vaccines for pneumonia, shingles, and COVID-19 depending on age and health conditions. Consult your healthcare provider.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How can I manage stress effectively?</AccordionTrigger>
                <AccordionContent>
                  Effective stress management includes regular exercise, adequate sleep, mindfulness practices, social connections, time management, and seeking professional help when needed. Find what works best for you.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>What are the signs of a medical emergency?</AccordionTrigger>
                <AccordionContent>
                  Seek immediate medical attention for: chest pain, difficulty breathing, severe bleeding, sudden numbness, confusion, severe allergic reactions, or loss of consciousness. When in doubt, call emergency services.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthInfo;
