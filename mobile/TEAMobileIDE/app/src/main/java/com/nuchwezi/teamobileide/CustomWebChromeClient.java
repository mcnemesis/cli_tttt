package com.nuchwezi.teamobileide;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;

public class CustomWebChromeClient extends WebChromeClient {
    private final Context context;
    private final String appName;
    private final String dialogTitle;

    public CustomWebChromeClient(Context context, String appName) {
        this.context = context;
        this.appName = appName;
        this.dialogTitle = "";
    }

    @Override
    public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_message, null);
        TextView msgView = dialogView.findViewById(R.id.dialogMessage);
        msgView.setText(message);

        AlertDialog dialog = new AlertDialog.Builder(context)
                .setTitle(dialogTitle)
                .setView(dialogView)
                .setPositiveButton("OK", (d, which) -> result.confirm())
                .setCancelable(true)
                .create();

        dialog.setOnCancelListener(d -> result.confirm());
        dialog.setOnDismissListener(d -> result.confirm());

        dialog.show();
        return true;
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_message, null);
        TextView msgView = dialogView.findViewById(R.id.dialogMessage);
        msgView.setText(message);

        AlertDialog dialog = new AlertDialog.Builder(context)
                .setTitle(dialogTitle)
                .setView(dialogView)
                .setPositiveButton("OK", (d, which) -> result.confirm())
                .setCancelable(true)
                .create();

        dialog.setOnCancelListener(d -> result.confirm());
        dialog.setOnDismissListener(d -> result.confirm());

        dialog.show();
        return true;
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_prompt, null);
        TextView msgView = dialogView.findViewById(R.id.promptMessage);
        EditText input = dialogView.findViewById(R.id.promptInput);

        msgView.setText(message);
        input.setText(defaultValue);

        AlertDialog dialog = new AlertDialog.Builder(context)
                .setTitle(dialogTitle)
                .setView(dialogView)
                .setPositiveButton("OK", (d, which) -> result.confirm(input.getText().toString()))
                .setCancelable(true)
                .create();

        dialog.setOnCancelListener(d -> result.confirm(input.getText().toString()));
        dialog.setOnDismissListener(d -> result.confirm(input.getText().toString()));
        dialog.show();

        return true;
    }
}



