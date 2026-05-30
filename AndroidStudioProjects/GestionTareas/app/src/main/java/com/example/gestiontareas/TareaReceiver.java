package com.example.gestiontareas;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class TareaReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

        String titulo = intent.getStringExtra("titulo");
        String descripcion = intent.getStringExtra("descripcion");

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        String channelId = "tareas_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            channelId,
                            "Recordatorios",
                            NotificationManager.IMPORTANCE_HIGH);

            channel.setDescription("Recordatorios de tareas");

            manager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(context, channelId)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle("⏰ Tarea próxima a vencer")
                        .setContentText(titulo)
                        .setStyle(
                                new NotificationCompat.BigTextStyle()
                                        .bigText(
                                                "Tarea: " + titulo +
                                                        "\n\nDescripción: " + descripcion
                                        )
                        )
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true);

        manager.notify(
                (int) System.currentTimeMillis(),
                builder.build()
        );
    }
}