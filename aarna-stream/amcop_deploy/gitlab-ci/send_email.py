"""[This script sends an email based on given inputs]
"""
import argparse

import yagmail


def send_mail(receiver, body, attachment_list, email_subject, sender_password):
    """[summary]

    Args:
        receiver ([str]): [receiver email address]
        body ([str]): [The message content of the email]
        attachment_list ([str]): [The list of files to attach]
        email_subject ([str]): [The subject for the email]
        sender_password ([str]): [The password of the sender]
    """
    yag = yagmail.SMTP("aarna.gitlab@aarnanetworks.com", sender_password)
    if attachment_list is None:
        yag.send(
            to=receiver,
            subject=email_subject,
            contents=body,
        )
    else:
        yag.send(to=receiver,
                 subject=email_subject,
                 contents=body,
                 attachments=attachment_list)


def main():
    """[The main function]
    """
    parser = argparse.ArgumentParser(
        description='Arguments for the email script')
    parser.add_argument('--reciever_email',
                        '-re',
                        type=str,
                        help='The email address of the reciever')
    parser.add_argument('--email_body',
                        '-eb',
                        type=str,
                        help='The message content of the email')
    parser.add_argument('--attachments',
                        '-a',
                        type=str,
                        help='The list of files to attach')
    parser.add_argument('--subject',
                        type=str,
                        help='The subject for the email')

    parser.add_argument('--sender_password',
                        type=str,
                        help='The password of the sender')

    args = parser.parse_args()
    receiver = args.reciever_email
    body = args.email_body
    subject = args.subject
    sender_password = args.sender_password
    attachment_list = args.attachments
    if attachment_list:
        attachment_list = args.attachments.split(',')
    else:
        attachment_list = None
    send_mail(receiver, body, attachment_list, subject, sender_password)


if __name__ == "__main__":
    main()
