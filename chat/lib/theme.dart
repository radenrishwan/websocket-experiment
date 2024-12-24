import 'package:flutter/material.dart';

ThemeData createDefaultLightTheme(ColorScheme? colorScheme) {
  return ThemeData.light(
    useMaterial3: true,
  ).copyWith(
    colorScheme: colorScheme ??
        ColorScheme.fromSwatch(
          primarySwatch: Colors.green,
          brightness: Brightness.light,
          backgroundColor: Colors.green.shade50,
        ),
  );
}

ThemeData createDefaultDarkTheme(ColorScheme? colorScheme) {
  return ThemeData.dark(
    useMaterial3: true,
  ).copyWith(
    colorScheme: colorScheme ??
        ColorScheme.fromSwatch(
          primarySwatch: Colors.green,
          brightness: Brightness.dark,
          backgroundColor: Colors.black,
        ),
  );
}
