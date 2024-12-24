import 'package:chat/features/chat/chat_screen.dart';
import 'package:flutter/material.dart';

class User {
  final String name;

  const User({
    required this.name,
  });
}

final nameDummy = [
  "John",
  "Doe",
  "Jane",
  "Smith",
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve: Mallory",
  "Oscar"
];

final userDummy = List.generate(
  nameDummy.length,
  (index) => User(name: nameDummy[index]),
);

class UserView extends StatelessWidget {
  final List<User> users;

  const UserView({super.key, required this.users});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: users.length,
      itemBuilder: (context, index) {
        return ListTile(
          leading: const Icon(Icons.person),
          title: Text(users[index].name),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ChatScreen(title: users[index].name),
              ),
            );
          },
        );
      },
    );
  }
}
