package Database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import Models.Tarea;

import java.util.ArrayList;
import java.util.List;

public class Database extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "tareas.db";
    private static final int DATABASE_VERSION = 3;

    private static final String TABLE_TAREAS = "tareas";

    private static final String COLUMN_ID = "id";
    private static final String COLUMN_TITULO = "titulo";
    private static final String COLUMN_DESCRIPCION = "descripcion";
    private static final String COLUMN_ESTADO = "estado";
    private static final String COLUMN_FECHA = "fecha";
    private static final String COLUMN_HORA = "hora";

    // 🔥 NUEVOS CAMPOS PARA CRONÓMETRO
    private static final String COLUMN_TIEMPO = "tiempo";
    private static final String COLUMN_ACTIVO = "activo";

    public Database(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {

        String query = "CREATE TABLE " + TABLE_TAREAS + " (" +
                COLUMN_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                COLUMN_TITULO + " TEXT, " +
                COLUMN_DESCRIPCION + " TEXT, " +
                COLUMN_ESTADO + " TEXT, " +
                COLUMN_FECHA + " TEXT, " +
                COLUMN_HORA + " TEXT, " +
                COLUMN_TIEMPO + " INTEGER, " +
                COLUMN_ACTIVO + " INTEGER)";

        db.execSQL(query);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_TAREAS);
        onCreate(db);
    }

    public void insertarTarea(Tarea tarea) {

        SQLiteDatabase db = this.getWritableDatabase();

        ContentValues values = new ContentValues();
        values.put(COLUMN_TITULO, tarea.getTitulo());
        values.put(COLUMN_DESCRIPCION, tarea.getDescripcion());
        values.put(COLUMN_ESTADO, tarea.getEstado());
        values.put(COLUMN_FECHA, tarea.getFecha());
        values.put(COLUMN_HORA, tarea.getHora());

        // 🔥 CRONÓMETRO INICIAL
        values.put(COLUMN_TIEMPO, 0);
        values.put(COLUMN_ACTIVO, 0);

        db.insert(TABLE_TAREAS, null, values);
        db.close();
    }

    public List<Tarea> obtenerTareas() {

        List<Tarea> lista = new ArrayList<>();

        SQLiteDatabase db = this.getReadableDatabase();

        Cursor cursor = db.rawQuery("SELECT * FROM " + TABLE_TAREAS, null);

        if (cursor.moveToFirst()) {
            do {

                Tarea tarea = new Tarea();

                tarea.setId(cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ID)));
                tarea.setTitulo(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_TITULO)));
                tarea.setDescripcion(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_DESCRIPCION)));
                tarea.setEstado(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ESTADO)));
                tarea.setFecha(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_FECHA)));
                tarea.setHora(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_HORA)));

                // 🔥 CRONÓMETRO
                tarea.setTiempoInvertido(cursor.getLong(cursor.getColumnIndexOrThrow(COLUMN_TIEMPO)));
                tarea.setCronometroActivo(cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_ACTIVO)) == 1);

                lista.add(tarea);

            } while (cursor.moveToNext());
        }

        cursor.close();
        db.close();

        return lista;
    }

    public void eliminarTarea(int id) {

        SQLiteDatabase db = this.getWritableDatabase();

        db.delete(TABLE_TAREAS, COLUMN_ID + "=?", new String[]{String.valueOf(id)});

        db.close();
    }

    public void actualizarEstadoTarea(int id, String nuevoEstado) {

        SQLiteDatabase db = this.getWritableDatabase();

        ContentValues values = new ContentValues();
        values.put(COLUMN_ESTADO, nuevoEstado);

        db.update(TABLE_TAREAS, values, COLUMN_ID + "=?", new String[]{String.valueOf(id)});

        db.close();
    }

    // 🔥 NUEVO: ACTUALIZAR CRONÓMETRO
    public void actualizarTiempoTarea(int id, long tiempo, int activo) {

        SQLiteDatabase db = this.getWritableDatabase();

        ContentValues values = new ContentValues();
        values.put(COLUMN_TIEMPO, tiempo);
        values.put(COLUMN_ACTIVO, activo);

        db.update(TABLE_TAREAS, values, COLUMN_ID + "=?", new String[]{String.valueOf(id)});

        db.close();
    }
}