// import amqplib from 'amqplib';
//
// export async function setupExchange(rabbitUri: string) {
// 	const connection = await amqplib.connect(rabbitUri);
// 	const channel = await connection.createChannel();
//
// 	const exchange = 'microservice_exchange';
// 	await channel.assertExchange(exchange, 'topic', { durable: true });
//
// 	await channel.assertQueue('notification_queue', { durable: true });
// 	await channel.bindQueue('notification_queue', exchange, 'notification.*');
//
// 	await channel.assertQueue('billing_queue', { durable: true });
// 	await channel.bindQueue('billing_queue', exchange, 'billing.*');
//
// 	await channel.close();
// 	await connection.close();
// 	console.log('[RabbitMQ] Setup completed');
// }
