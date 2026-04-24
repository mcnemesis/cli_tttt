package com.nuchwezi.teamobileide;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

public class MainActivity extends AppCompatActivity {

    public static final String TAG = "TEAMOBILEIDE";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        /* AUTO: bootstrapping... */
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        /* Custom: bootstrapping... */
        WebView webView = findViewById(R.id.webview);
        // align WebView behavior closer to Chrome
        webView.setWebChromeClient(new WebChromeClient());

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // so we can load assets via file://... in the html without CORS errors
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowFileAccessFromFileURLs(true);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(true);

        // Load your SPA from local assets
        webView.loadUrl("file:///android_asset/web_tea/index.html");

        // for force-reloading webview
        FloatingActionButton reloadButton = findViewById(R.id.reloadButton);
        reloadButton.setOnClickListener(v -> {
            webView.reload();
        });

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                String failingUrl = request.getUrl().toString();
                int errorCode = error.getErrorCode();
                CharSequence description = error.getDescription();

                String message = "Error loading: " + failingUrl + "\n"
                        + "Code: " + errorCode + "\n"
                        + "Details: " + description;

                Utility.showAlert("Mobile IDE Error", message, MainActivity.this);
            }

        });

    }
}