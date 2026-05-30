package com.example.gestiontareas;

import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
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

import java.util.Calendar;
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

        btnAgregar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                agregarTarea();
            }
        });

        btnSeleccionarFecha.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mostrarDatePicker();
            }
        });

        btnSeleccionarHora.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mostrarTimePicker();
            }
        });
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
        });
    }

    private void agregarTarea() {
        String titulo = etTitulo.getText().toString().trim();
        String descripcion = etDescripcion.getText().toString().trim();

        if (titulo.isEmpty()) {
            Toast.makeText(this, "Por favor, ingrese un título", Toast.LENGTH_SHORT).show();
            return;
        }

        // Si no hay fecha u hora, usar valores por defecto
        String fecha = fechaSeleccionada.isEmpty() ? "Sin fecha" : fechaSeleccionada;
        String hora = horaSeleccionada.isEmpty() ? "Sin hora" : horaSeleccionada;

        Tarea nuevaTarea = new Tarea();
        nuevaTarea.setTitulo(titulo);
        nuevaTarea.setDescripcion(descripcion);
        nuevaTarea.setEstado(Tarea.ESTADO_CREADA);
        nuevaTarea.setFecha(fecha);
        nuevaTarea.setHora(hora);

        database.insertarTarea(nuevaTarea);

        etTitulo.setText("");
        etDescripcion.setText("");
        fechaSeleccionada = "";
        horaSeleccionada = "";
        tvFechaSeleccionada.setText("Fecha: No seleccionada");
        tvHoraSeleccionada.setText("Hora: No seleccionada");

        actualizarLista();
        Toast.makeText(this, "Tarea agregada exitosamente", Toast.LENGTH_SHORT).show();
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
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
                this,
                new DatePickerDialog.OnDateSetListener() {
                    @Override
                    public void onDateSet(DatePicker view, int year, int month, int dayOfMonth) {
                        fechaSeleccionada = String.format(Locale.getDefault(), "%02d/%02d/%d", dayOfMonth, month + 1, year);
                        tvFechaSeleccionada.setText("Fecha: " + fechaSeleccionada);
                    }
                },
                year, month, day
        );
        datePickerDialog.show();
    }

    private void mostrarTimePicker() {
        Calendar calendar = Calendar.getInstance();
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
        int minute = calendar.get(Calendar.MINUTE);

        TimePickerDialog timePickerDialog = new TimePickerDialog(
                this,
                new TimePickerDialog.OnTimeSetListener() {
                    @Override
                    public void onTimeSet(TimePicker view, int hourOfDay, int minute) {
                        horaSeleccionada = String.format(Locale.getDefault(), "%02d:%02d", hourOfDay, minute);
                        tvHoraSeleccionada.setText("Hora: " + horaSeleccionada);
                    }
                },
                hour, minute, true
        );
        timePickerDialog.show();
    }

    private void cambiarEstadoTarea(final int position) {
        final Tarea tarea = listaTareas.get(position);
        final String estadoActual = tarea.getEstado();

        String[] opciones;
        if (estadoActual.equals(Tarea.ESTADO_CREADA)) {
            opciones = new String[]{Tarea.ESTADO_PENDIENTE, Tarea.ESTADO_REALIZADA};
        } else if (estadoActual.equals(Tarea.ESTADO_PENDIENTE)) {
            opciones = new String[]{Tarea.ESTADO_REALIZADA, Tarea.ESTADO_CREADA};
        } else {
            opciones = new String[]{Tarea.ESTADO_CREADA, Tarea.ESTADO_PENDIENTE};
        }

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Cambiar estado de: " + tarea.getTitulo());
        builder.setItems(opciones, (dialog, which) -> {
            String nuevoEstado = opciones[which];
            database.actualizarEstadoTarea(tarea.getId(), nuevoEstado);
            actualizarLista();
            Toast.makeText(MainActivity.this, "Estado actualizado a: " + nuevoEstado, Toast.LENGTH_SHORT).show();
        });
        builder.setNegativeButton("Cancelar", null);
        builder.show();
    }
}
