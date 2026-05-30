package Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gestiontareas.R;

import java.util.List;

import Models.Tarea;

public class TareaAdapter extends RecyclerView.Adapter<TareaAdapter.TareaViewHolder> {

    private List<Tarea> listaTareas;
    private OnItemClickListener listener;

    public interface OnItemClickListener {
        void onDeleteClick(int position);
        void onChangeStatusClick(int position);
        void onCronometroClick(int position);
    }

    public void setOnItemClickListener(OnItemClickListener listener) {
        this.listener = listener;
    }

    public TareaAdapter(List<Tarea> listaTareas) {
        this.listaTareas = listaTareas;
    }

    @NonNull
    @Override
    public TareaViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_tarea, parent, false);

        return new TareaViewHolder(view, listener);
    }

    @Override
    public void onBindViewHolder(@NonNull TareaViewHolder holder, int position) {

        Tarea tareaActual = listaTareas.get(position);

        holder.tvTitulo.setText(tareaActual.getTitulo());
        holder.tvDescripcion.setText(tareaActual.getDescripcion());
        holder.tvEstado.setText("Estado: " + tareaActual.getEstado());

        String fecha =
                tareaActual.getFecha() != null
                        ? tareaActual.getFecha()
                        : "Sin fecha";

        String hora =
                tareaActual.getHora() != null
                        ? tareaActual.getHora()
                        : "Sin hora";

        holder.tvFecha.setText(fecha);
        holder.tvHora.setText(hora);

        int color = tareaActual.getColorEstado();

        holder.viewIndicadorColor.setBackgroundColor(color);
        holder.tvEstado.setTextColor(color);

        // Mostrar tiempo invertido
        holder.tvTiempo.setText(
                "⏱ Tiempo: " +
                        tareaActual.getTiempoFormateado()
        );

        // Cambiar texto del botón
        if (tareaActual.isCronometroActivo()) {
            holder.btnCronometro.setText("⏸ Pausar");
        } else {
            holder.btnCronometro.setText("▶ Iniciar");
        }
    }

    @Override
    public int getItemCount() {
        return listaTareas.size();
    }

    public static class TareaViewHolder extends RecyclerView.ViewHolder {

        public TextView tvTitulo;
        public TextView tvDescripcion;
        public TextView tvEstado;
        public TextView tvFecha;
        public TextView tvHora;
        public TextView tvTiempo;

        public Button btnEliminar;
        public Button btnCambiarEstado;
        public Button btnCronometro;

        public View viewIndicadorColor;

        public TareaViewHolder(
                @NonNull View itemView,
                final OnItemClickListener listener
        ) {
            super(itemView);

            tvTitulo = itemView.findViewById(R.id.tvTitulo);
            tvDescripcion = itemView.findViewById(R.id.tvDescripcion);
            tvEstado = itemView.findViewById(R.id.tvEstado);
            tvFecha = itemView.findViewById(R.id.tvFecha);
            tvHora = itemView.findViewById(R.id.tvHora);
            tvTiempo = itemView.findViewById(R.id.tvTiempo);

            btnEliminar = itemView.findViewById(R.id.btnEliminar);
            btnCambiarEstado = itemView.findViewById(R.id.btnCambiarEstado);
            btnCronometro = itemView.findViewById(R.id.btnCronometro);

            viewIndicadorColor =
                    itemView.findViewById(R.id.viewIndicadorColor);

            btnEliminar.setOnClickListener(v -> {
                if (listener != null) {

                    int position = getAdapterPosition();

                    if (position != RecyclerView.NO_POSITION) {
                        listener.onDeleteClick(position);
                    }
                }
            });

            btnCambiarEstado.setOnClickListener(v -> {
                if (listener != null) {

                    int position = getAdapterPosition();

                    if (position != RecyclerView.NO_POSITION) {
                        listener.onChangeStatusClick(position);
                    }
                }
            });

            btnCronometro.setOnClickListener(v -> {
                if (listener != null) {

                    int position = getAdapterPosition();

                    if (position != RecyclerView.NO_POSITION) {
                        listener.onCronometroClick(position);
                    }
                }
            });
        }
    }
}