import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MessageSquareX, DollarSign, ClipboardX } from "lucide-react";

const problems = [
  {
    icon: MessageSquareX,
    title: "Perde cliente porque demorou pra responder?",
    description: "Clientes não esperam. Se você demora 5 minutos, ele já agendou no concorrente.",
  },
  {
    icon: DollarSign,
    title: "Esquece de cobrar taxa de quem falta?",
    description: "Sem sistema, você perde dinheiro toda semana com no-shows e desistências.",
  },
  {
    icon: ClipboardX,
    title: "Agenda de papel bagunçada?",
    description: "Rasuras, conflitos de horário e zero controle sobre seus compromissos.",
  },
];

export function ProblemSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={ref}
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-destructive font-semibold text-sm uppercase tracking-wider">
            O Problema
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Isso parece familiar?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div
              key={index}
              className={`group p-6 rounded-xl bg-charcoal/50 border border-destructive/30 hover:border-destructive/60 transition-all duration-500 hover:transform hover:scale-105 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-14 h-14 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <problem.icon className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {problem.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
