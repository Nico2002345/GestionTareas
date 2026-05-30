package com.example.gestiontareas;

import android.Manifest;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.PendingIntent;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
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

        recyclerView.setLayoutManager(
                new LinearLayoutManager(this)
        );

        recyclerView.setAdapter(adapter);

        adapter.setOnItemClickListener(
                new TareaAdapter.OnItemClickListener() {

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

                    }
                });
    }

    private void agregarTarea() {

        String titulo = etTitulo.getText().toString().trim();
        String descripcion = etDescripcion.getText().toString().trim();

        if (titulo.isEmpty()) {
            Toast.makeText(
                    this,
                    "Por favor ingrese un título",
                    Toast.LENGTH_SHORT
            ).show();
            return;
        }

        String fecha = fechaSeleccionada.isEmpty()
                ? "Sin fecha"
                : fechaSeleccionada;

        String hora = horaSeleccionada.isEmpty()
                ? "Sin hora"
                : horaSeleccionada;

        Tarea nuevaTarea = new Tarea();

        nuevaTarea.setTitulo(titulo);
        nuevaTarea.setDescripcion(descripcion);
        nuevaTarea.setEstado(Tarea.ESTADO_CREADA);
        nuevaTarea.setFecha(fecha);
        nuevaTarea.setHora(hora);

        database.insertarTarea(nuevaTarea);

        if (!fecha.equals("Sin fecha") &&
                !hora.equals("Sin hora")) {

            programarRecordatorio(
                    titulo,
                    descripcion,
                    fecha,
                    hora
            );
        }

        etTitulo.setText("");
        etDescripcion.setText("");

        fechaSeleccionada = "";
        horaSeleccionada = "";

        tvFechaSeleccionada.setText(
                "Fecha: No seleccionada"
        );

        tvHoraSeleccionada.setText(
                "Hora: No seleccionada"
        );

        actualizarLista();

        Toast.makeText(
                this,
                "Tarea agregada exitosamente",
                Toast.LENGTH_SHORT
        ).show();
    }

    private void programarRecordatorio(
            String titulo,
            String descripcion,
            String fecha,
            String hora) {

        try {

            SimpleDateFormat formato =
                    new SimpleDateFormat(
                            "dd/MM/yyyy HH:mm",
                            Locale.getDefault());

            Date fechaHora =
                    formato.parse(fecha + " " + hora);

            if (fechaHora == null) return;

            long tiempoRecordatorio =
                    fechaHora.getTime()
                            - (15 * 60 * 1000);

            Intent intent =
                    new Intent(
                            this,
                            TareaReceiver.class);

            intent.putExtra("titulo", titulo);
            intent.putExtra("descripcion", descripcion);

            PendingIntent pendingIntent =
                    PendingIntent.getBroadcast(
                            this,
                            (int) System.currentTimeMillis(),
                            intent,
                            PendingIntent.FLAG_UPDATE_CURRENT
                                    | PendingIntent.FLAG_IMMUTABLE
                    );

            AlarmManager alarmManager =
                    (AlarmManager) getSystemService(ALARM_SERVICE);

            if (alarmManager != null) {

                alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        tiempoRecordatorio,
                        pendingIntent
                );
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
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

    private void mostrarDatePicker() {

        Calendar calendar =
                Calendar.getInstance();

        int year =
                calendar.get(Calendar.YEAR);

        int month =
                calendar.get(Calendar.MONTH);

        int day =
                calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog =
                new DatePickerDialog(
                        this,
                        (view, year1, month1, dayOfMonth) -> {

                            fechaSeleccionada =
                                    String.format(
                                            Locale.getDefault(),
                                            "%02d/%02d/%d",
                                            dayOfMonth,
                                            month1 + 1,
                                            year1);

                            tvFechaSeleccionada.setText(
                                    "Fecha: "
                                            + fechaSeleccionada
                            );
                        },
                        year,
                        month,
                        day
                );

        datePickerDialog.show();
    }

    private void mostrarTimePicker() {

        Calendar calendar =
                Calendar.getInstance();

        int hour =
                calendar.get(Calendar.HOUR_OF_DAY);

        int minute =
                calendar.get(Calendar.MINUTE);

        TimePickerDialog timePickerDialog =
                new TimePickerDialog(
                        this,
                        (view, hourOfDay, minute1) -> {

                            horaSeleccionada =
                                    String.format(
                                            Locale.getDefault(),
                                            "%02d:%02d",
                                            hourOfDay,
                                            minute1
                                    );

                            tvHoraSeleccionada.setText(
                                    "Hora: "
                                            + horaSeleccionada
                            );
                        },
                        hour,
                        minute,
                        true
                );

        timePickerDialog.show();
    }

    private void cambiarEstadoTarea(int position) {

        Tarea tarea =
                listaTareas.get(position);

        String estadoActual =
                tarea.getEstado();

        String[] opciones;

        if (estadoActual.equals(
                Tarea.ESTADO_CREADA)) {

            opciones = new String[]{
                    Tarea.ESTADO_PENDIENTE,
                    Tarea.ESTADO_REALIZADA
            };

        } else if (estadoActual.equals(
                Tarea.ESTADO_PENDIENTE)) {

            opciones = new String[]{
                    Tarea.ESTADO_REALIZADA,
                    Tarea.ESTADO_CREADA
            };

        } else {

            opciones = new String[]{
                    Tarea.ESTADO_CREADA,
                    Tarea.ESTADO_PENDIENTE
            };
        }

        AlertDialog.Builder builder =
                new AlertDialog.Builder(this);

        builder.setTitle(
                "Cambiar estado de: "
                        + tarea.getTitulo());

        builder.setItems(
                opciones,
                (dialog, which) -> {

                    String nuevoEstado =
                            opciones[which];

                    database.actualizarEstadoTarea(
                            tarea.getId(),
                            nuevoEstado);

                    actualizarLista();

                    Toast.makeText(
                            MainActivity.this,
                            "Estado actualizado a: "
                                    + nuevoEstado,
                            Toast.LENGTH_SHORT
                    ).show();
                });

        builder.setNegativeButton(
                "Cancelar",
                null
        );

        builder.show();
    }
}