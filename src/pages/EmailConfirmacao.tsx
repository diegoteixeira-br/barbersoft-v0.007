import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Scissors, ArrowRight, RefreshCw, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function EmailConfirmacao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  // Try to get the email from the current session or from URL
  const email = new URLSearchParams(window.location.search).get("email") || "";

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email não encontrado",
        description: "Faça o cadastro novamente para receber o email de confirmação.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast({
          title: "Erro ao reenviar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email reenviado!",
          description: "Verifique sua caixa de entrada e pasta de spam.",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Link to="/" className="mb-8 flex flex-col items-center group">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-gold group-hover:scale-105 transition-transform">
            <Scissors className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gold group-hover:text-gold/80 transition-colors">BarberSoft</h1>
        </Link>

        <Card className="border-border bg-card">
          <CardContent className="pt-8 pb-8 space-y-6 text-center">
            {/* Animated mail icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Inbox className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Verifique sua caixa de entrada</h2>
              <p className="text-muted-foreground">
                Enviamos um email de confirmação
                {email && (
                  <>
                    {" "}para <span className="font-semibold text-foreground">{email}</span>
                  </>
                )}
                . Clique no link para ativar sua conta.
              </p>
            </div>

            {/* Tips */}
            <div className="rounded-lg bg-muted/50 p-4 text-left space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Dicas importantes:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Verifique a pasta de <span className="font-medium text-foreground">spam</span> ou <span className="font-medium text-foreground">lixo eletrônico</span></li>
                <li>O email pode levar alguns minutos para chegar</li>
                <li>Procure por um email do remetente <span className="font-medium text-foreground">BarberSoft</span></li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending || !email}
              >
                {isResending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reenviando...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />Reenviar email de confirmação</>
                )}
              </Button>

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate("/auth?tab=login")}
              >
                Já confirmei, fazer login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Após confirmar seu email, faça login para acessar seu painel e escolher seu plano.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BarberSoft. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
