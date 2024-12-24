import 'package:chat/features/home/home_screen.dart';
import 'package:chat/theme.dart';
import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:sizer/sizer.dart';

void main() {
  runApp(const InitialApp());
}

class InitialApp extends StatelessWidget {
  const InitialApp({super.key});

  @override
  Widget build(BuildContext context) {
    return DynamicColorBuilder(
      builder: (context, colorScheme) {
        return Sizer(
          builder: (p0, p1, p2) {
            return MaterialApp(
              title: 'Chat',
              theme: createDefaultLightTheme(colorScheme),
              darkTheme: createDefaultDarkTheme(colorScheme),
              home: const HomeScreen(),
            );
          },
        );
      },
    );
  }
}
