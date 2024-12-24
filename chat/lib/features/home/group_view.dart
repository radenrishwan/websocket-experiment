import 'package:chat/features/group_chat/group_screen.dart';
import 'package:chat/features/home/api/home_api.dart';
import 'package:flutter/material.dart';

class GroupView extends StatelessWidget {
  const GroupView({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: HomeApi().fetchRooms(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return const Center(
            child: Text('Error'),
          );
        }

        if (snapshot.hasData) {
          var response = snapshot.data!;

          return StatefulBuilder(
            builder: (context, setState) {
              return RefreshIndicator(
                onRefresh: () async {
                  response = await HomeApi().fetchRooms();

                  setState(() {});
                },
                child: ListView.builder(
                  itemCount: response.rooms.length,
                  itemBuilder: (context, index) {
                    return ListTile(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) {
                              return GroupScreen(
                                title: response.rooms[index].name,
                                username: DateTime.now().toString(),
                              );
                            },
                          ),
                        );
                      },
                      leading: const CircleAvatar(
                        child: Icon(Icons.group),
                      ),
                      title: Text(response.rooms[index].name),
                      subtitle: Text(
                        response.rooms[index].lastMessage,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Chip(
                        label: Text(
                          response.rooms[index].count.toString(),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        }

        return const Center(child: Text('No data'));
      },
    );
  }
}
