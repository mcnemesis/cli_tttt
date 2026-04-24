package com.nuchwezi.teamobileide;

import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
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

        try {

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
            webView.setWebChromeClient(new CustomWebChromeClient(this, getString(R.string.app_name)));

            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.getSettings()// Set a modern User Agent string (Chrome-like)
            .setUserAgentString(
                    "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 " +
                            "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            );

            // Optional: allow mixed content if site loads HTTP inside HTTPS
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }

            // Enable cookies
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // so we can load assets via file://... in the html without CORS errors
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowFileAccessFromFileURLs(true);
            webView.getSettings().setAllowUniversalAccessFromFileURLs(true);

            webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimeType);
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription("Downloading file...");
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,
                        URLUtil.guessFileName(url, contentDisposition, mimeType));

                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.enqueue(request);

                Toast.makeText(getApplicationContext(), "Downloading File...", Toast.LENGTH_LONG).show();
            });


            // Load TEA MOBILE WEB IDE SPA from local assets
            webView.loadUrl("file:///android_asset/web_tea/index.html");

            // for app about info...
            FloatingActionButton infoButton = findViewById(R.id.infoButton);
            infoButton.setOnClickListener(v -> {
                showAbout();
            });


            // for force-reloading webview
            FloatingActionButton reloadButton = findViewById(R.id.reloadButton);
            reloadButton.setOnClickListener(v -> {
                //webView.reload();
                // Load TEA MOBILE WEB IDE SPA from local assets
                webView.loadUrl("file:///android_asset/web_tea/index.html");
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


            FloatingActionButton openBrowserButton = findViewById(R.id.openBrowserButton);

            openBrowserButton.setOnClickListener(v -> {
                String url = "https://tea.nuchwezi.com";
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent); // opens in external browser
            });

        }catch (Exception exception){
            Utility.showAlert(getString(R.string.app_name) + " | ERROR!", exception.getMessage(), this);
        }

    }

    private void showAbout() {

        Utility.showAlert(
                this.getString(R.string.app_name),
                String.format("Version %s (Build %s)\n\n%s",
                        Utility.getVersionName(this),
                        Utility.getVersionNumber(this),
                        this.getString(R.string.powered_by)),
                R.mipmap.ic_launcher, this);
    }

}