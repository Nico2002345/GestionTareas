package com.example.gestiontareas;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class TareaReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID = "tareas_channel";

    @Override
    public void onReceive(Context context, Intent intent) {

        String titulo = intent.getStringExtra("titulo");
        String descripcion = intent.getStringExtra("descripcion");

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // 🔥 Crear canal (OBLIGATORIO para Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Recordatorios de Tareas",
                            NotificationManager.IMPORTANCE_HIGH // 🔥 IMPORTANTE para popup
                    );

            channel.setDescription("Notificaciones de tareas");

            // 🔥 Hacerlo más visible
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setShowBadge(true);

            manager.createNotificationChannel(channel);
        }

        // 🔥 Notificación tipo "heads-up"
        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(context, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .setContentTitle("⏰ Tarea próxima")
                        .setContentText(titulo)
                        .setStyle(new NotificationCompat.BigTextStyle()
                                .bigText("Tarea: " + titulo + "\n\n" + descripcion))
                        .setPriority(NotificationCompat.PRIORITY_HIGH) // 🔥 clave
                        .setCategory(NotificationCompat.CATEGORY_ALARM) // 🔥 clave
                        .setAutoCancel(true)
                        .setVibrate(new long[]{0, 500, 200, 500});

        manager.notify((int) System.currentTimeMillis(), builder.build());
    }
}