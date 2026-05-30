package Models;

public class Tarea {

    // Estados posibles
    public static final String ESTADO_CREADA = "Creada";
    public static final String ESTADO_PENDIENTE = "Pendiente";
    public static final String ESTADO_REALIZADA = "Realizada";

    private int id;
    private String titulo;
    private String descripcion;
    private String estado;
    private String fecha;
    private String hora;

    // Cronómetro
    private long tiempoInvertido;
    private boolean cronometroActivo;

    public Tarea() {
        this.tiempoInvertido = 0;
        this.cronometroActivo = false;
    }

    public Tarea(int id,
                 String titulo,
                 String descripcion,
                 String estado,
                 String fecha,
                 String hora,
                 long tiempoInvertido,
                 boolean cronometroActivo) {

        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.estado = estado;
        this.fecha = fecha;
        this.hora = hora;
        this.tiempoInvertido = tiempoInvertido;
        this.cronometroActivo = cronometroActivo;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getHora() {
        return hora;
    }

    public void setHora(String hora) {
        this.hora = hora;
    }

    public long getTiempoInvertido() {
        return tiempoInvertido;
    }

    public void setTiempoInvertido(long tiempoInvertido) {
        this.tiempoInvertido = tiempoInvertido;
    }

    public boolean isCronometroActivo() {
        return cronometroActivo;
    }

    public void setCronometroActivo(boolean cronometroActivo) {
        this.cronometroActivo = cronometroActivo;
    }

    // Formato HH:mm:ss
    public String getTiempoFormateado() {

        long segundos = tiempoInvertido / 1000;

        long horas = segundos / 3600;
        long minutos = (segundos % 3600) / 60;
        long segs = segundos % 60;

        return String.format(
                "%02d:%02d:%02d",
                horas,
                minutos,
                segs
        );
    }

    // Color según estado
    public int getColorEstado() {

        switch (estado) {

            case ESTADO_CREADA:
                return 0xFFFF0000; // Rojo

            case ESTADO_PENDIENTE:
                return 0xFFFFFF00; // Amarillo

            case ESTADO_REALIZADA:
                return 0xFF00FF00; // Verde

            default:
                return 0xFF808080; // Gris
        }
    }

    @Override
    public String toString() {
        return "Tarea{" +
                "id=" + id +
                ", titulo='" + titulo + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", estado='" + estado + '\'' +
                ", fecha='" + fecha + '\'' +
                ", hora='" + hora + '\'' +
                ", tiempoInvertido=" + tiempoInvertido +
                ", cronometroActivo=" + cronometroActivo +
                '}';
    }
}