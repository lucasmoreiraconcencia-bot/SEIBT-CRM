import { Lock } from "lucide-react";

/** Aviso exibido quando o participante ainda não foi marcado como pago. */
export function PaymentNotice() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
      <Lock size={18} className="mt-0.5 shrink-0 text-amber-400" />
      <div>
        <p className="font-semibold text-amber-300">
          Palpites bloqueados — pagamento pendente
        </p>
        <p className="mt-0.5 text-sm text-white/60">
          Faça o pagamento e avise o administrador. Assim que ele confirmar,
          seus palpites são liberados na hora.
        </p>
      </div>
    </div>
  );
}
