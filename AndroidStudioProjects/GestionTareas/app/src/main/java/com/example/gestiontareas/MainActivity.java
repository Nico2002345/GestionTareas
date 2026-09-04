package com.example.gestiontareas;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.PendingIntent;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.TimePicker;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import Adapters.TareaAdapter;
import Database.Database;
import Models.Tarea;

public class MainActivity extends AppCompatActivity {

    private EditText etTitulo, etDescripcion;
    private Button btnAgregar, btnSeleccionarFecha, btnSeleccionarHora;
    private TextView tvFechaSeleccionada, tvHoraSeleccionada;
    private RecyclerView recyclerView;

    private TareaAdapter adapter;
    private Database database;
    private List<Tarea> listaTareas;

    private String fechaSeleccionada = "";
    private String horaSeleccionada = "";

    private Handler handler = new Handler();

    private int tareaActivaIndex = -1;
    private Runnable cronometroRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    100
            );
        }

        etTitulo = findViewById(R.id.etTitulo);
        etDescripcion = findViewById(R.id.etDescripcion);
        btnAgregar = findViewById(R.id.btnAgregar);
        btnSeleccionarFecha = findViewById(R.id.btnSeleccionarFecha);
        btnSeleccionarHora = findViewById(R.id.btnSeleccionarHora);
        tvFechaSeleccionada = findViewById(R.id.tvFechaSeleccionada);
        tvHoraSeleccionada = findViewById(R.id.tvHoraSeleccionada);
        recyclerView = findViewById(R.id.recyclerView);

        database = new Database(this);

        cargarTareas();

        btnAgregar.setOnClickListener(v -> agregarTarea());
        btnSeleccionarFecha.setOnClickListener(v -> mostrarDatePicker());
        btnSeleccionarHora.setOnClickListener(v -> mostrarTimePicker());
    }

    private void cargarTareas() {

        listaTareas = database.obtenerTareas();

        adapter = new TareaAdapter(listaTareas);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);

        adapter.setOnItemClickListener(new TareaAdapter.OnItemClickListener() {

            @Override
            public void onDeleteClick(int position) {
                eliminarTarea(position);
            }

            @Override
            public void onChangeStatusClick(int position) {
                cambiarEstadoTarea(position);
            }

            @Override
            public void onCronometroClick(int position) {
                iniciarPausarCronometro(position);
            }
        });
    }

    private void iniciarPausarCronometro(int position) {

        Tarea tarea = listaTareas.get(position);

        if (tarea.isCronometroActivo()) {

            tarea.setCronometroActivo(false);

            handler.removeCallbacks(cronometroRunnable);

            database.actualizarTiempoTarea(
                    tarea.getId(),
                    tarea.getTiempoInvertido(),
                    0
            );

            Toast.makeText(this, "Cronómetro pausado", Toast.LENGTH_SHORT).show();

        } else {

            detenerCronometrosActivos();

            tareaActivaIndex = position;
            tarea.setCronometroActivo(true);

            cronometroRunnable = new Runnable() {
                @Override
                public void run() {

                    Tarea t = listaTareas.get(tareaActivaIndex);

                    long nuevoTiempo = t.getTiempoInvertido() + 1000;
                    t.setTiempoInvertido(nuevoTiempo);

                    database.actualizarTiempoTarea(
                            t.getId(),
                            nuevoTiempo,
                            1
                    );

                    adapter.notifyItemChanged(tareaActivaIndex);

                    handler.postDelayed(this, 1000);
                }
            };

            handler.post(cronometroRunnable);

            Toast.makeText(this, "Cronómetro iniciado", Toast.LENGTH_SHORT).show();
        }

        adapter.notifyItemChanged(position);
    }

    private void detenerCronometrosActivos() {
        handler.removeCallbacksAndMessages(null);

        for (Tarea t : listaTareas) {
            if (t.isCronometroActivo()) {
                t.setCronometroActivo(false);
                database.actualizarTiempoTarea(
                        t.getId(),
                        t.getTiempoInvertido(),
                        0
                );
            }
        }
    }

    private void agregarTarea() {

        String titulo = etTitulo.getText().toString().trim();
        String descripcion = etDescripcion.getText().toString().trim();

        if (titulo.isEmpty()) {
            Toast.makeText(this, "Por favor ingrese un título", Toast.LENGTH_SHORT).show();
            return;
        }

        Tarea nuevaTarea = new Tarea();
        nuevaTarea.setTitulo(titulo);
        nuevaTarea.setDescripcion(descripcion);
        nuevaTarea.setEstado(Tarea.ESTADO_CREADA);
        nuevaTarea.setFecha(fechaSeleccionada.isEmpty() ? "Sin fecha" : fechaSeleccionada);
        nuevaTarea.setHora(horaSeleccionada.isEmpty() ? "Sin hora" : horaSeleccionada);
        nuevaTarea.setTiempoInvertido(0);
        nuevaTarea.setCronometroActivo(false);

        database.insertarTarea(nuevaTarea);
        programarNotificacion(nuevaTarea);

        etTitulo.setText("");
        etDescripcion.setText("");

        fechaSeleccionada = "";
        horaSeleccionada = "";

        actualizarLista();

        Toast.makeText(this, "Tarea agregada", Toast.LENGTH_SHORT).show();
    }

    private void eliminarTarea(int position) {
        Tarea tarea = listaTareas.get(position);
        database.eliminarTarea(tarea.getId());
        actualizarLista();
    }

    private void actualizarLista() {
        listaTareas.clear();
        listaTareas.addAll(database.obtenerTareas());
        adapter.notifyDataSetChanged();
    }

    private void cambiarEstadoTarea(int position) {

        Tarea tarea = listaTareas.get(position);

        String nuevoEstado;

        if (tarea.getEstado().equals(Tarea.ESTADO_CREADA)) {
            nuevoEstado = Tarea.ESTADO_PENDIENTE;
        } else if (tarea.getEstado().equals(Tarea.ESTADO_PENDIENTE)) {
            nuevoEstado = Tarea.ESTADO_REALIZADA;
        } else {
            nuevoEstado = Tarea.ESTADO_CREADA;
        }

        database.actualizarEstadoTarea(tarea.getId(), nuevoEstado);
        actualizarLista();

        Toast.makeText(this, "Estado actualizado", Toast.LENGTH_SHORT).show();
    }

    @SuppressLint("ScheduleExactAlarm")
    private void programarNotificacion(Tarea tarea) {
        if (tarea.getFecha().equals("Sin fecha") || tarea.getHora().equals("Sin hora")) return;

        try {
            String[] partesFecha = tarea.getFecha().split("/");
            String[] partesHora = tarea.getHora().split(":");

            int dia = Integer.parseInt(partesFecha[0]);
            int mes = Integer.parseInt(partesFecha[1]) - 1;
            int anio = Integer.parseInt(partesFecha[2]);
            int hora = Integer.parseInt(partesHora[0]);
            int minuto = Integer.parseInt(partesHora[1]);

            Calendar calendar = Calendar.getInstance();
            calendar.set(anio, mes, dia, hora, minuto, 0);
            calendar.set(Calendar.MILLISECOND, 0);

            if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                Toast.makeText(this, "La fecha/hora ya pasó, no se programó recordatorio", Toast.LENGTH_LONG).show();
                return;
            }

            Intent intent = new Intent(this, TareaReceiver.class);
            intent.putExtra("titulo", tarea.getTitulo());
            intent.putExtra("descripcion", tarea.getDescripcion());

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    this,
                    (int) System.currentTimeMillis(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            AlarmManager alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                Toast.makeText(this, "Permiso de alarmas exactas no concedido. Ve a Ajustes > Aplicaciones.", Toast.LENGTH_LONG).show();
                return;
            }

            alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.getTimeInMillis(),
                    pendingIntent
            );

            Toast.makeText(this, "Recordatorio programado para " + tarea.getFecha() + " " + tarea.getHora(), Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            Toast.makeText(this, "Error al programar recordatorio", Toast.LENGTH_SHORT).show();
        }
    }

    private void mostrarDatePicker() {

        Calendar calendar = Calendar.getInstance();

        new DatePickerDialog(this, (DatePicker view, int year, int month, int day) -> {

            fechaSeleccionada = String.format(
                    Locale.getDefault(),
                    "%02d/%02d/%d",
                    day, month + 1, year
            );

            tvFechaSeleccionada.setText("Fecha: " + fechaSeleccionada);

        }, calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)).show();
    }

    private void mostrarTimePicker() {

        Calendar calendar = Calendar.getInstance();

        new TimePickerDialog(this, (TimePicker view, int hour, int minute) -> {

            horaSeleccionada = String.format(
                    Locale.getDefault(),
                    "%02d:%02d",
                    hour, minute
            );

            tvHoraSeleccionada.setText("Hora: " + horaSeleccionada);

        }, calendar.get(Calendar.HOUR_OF_DAY),
                calendar.get(Calendar.MINUTE),
                true).show();
    }
}