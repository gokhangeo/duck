package com.paperduck.coloring;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    private DrawingView drawingView;
    private ImageButton currentPaint;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        drawingView = findViewById(R.id.drawing_view);
        LinearLayout paintColors = findViewById(R.id.paint_colors);
        currentPaint = (ImageButton) paintColors.getChildAt(0);
    }

    public void paintClicked(View view) {
        if (view != currentPaint) {
            ImageButton imgView = (ImageButton) view;
            String color = view.getTag().toString();
            drawingView.setColor(color);
            imgView.setImageDrawable(ContextCompat.getDrawable(this, R.drawable.paint_pressed));
            currentPaint.setImageDrawable(ContextCompat.getDrawable(this, R.drawable.paint));
            currentPaint = (ImageButton) view;
        }
    }

    public void changeImage(View view) {
        // Resim değiştirme fonksiyonu burada olacak
        drawingView.loadNextImage();
    }
} 